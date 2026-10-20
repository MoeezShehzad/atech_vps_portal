// ==============================================================================
// Controller: geoController.js
// Purpose: Live Geographical API querying MS SQL Server tables:
//          [UM].[UM_Countries], [UM].[UM_Provinces], [UM].[UM_Counties], [UM].[UM_Cities]
//          with high-fidelity global fallback from country-state-city.
// ==============================================================================

import prisma from '../lib/prisma.js';
import { State, City } from 'country-state-city';

// Convert 2-letter ISO code to native emoji flag
const isoToFlag = (iso) => {
  const code = (iso || '').trim().toUpperCase();
  if (code.length !== 2) return '🌐';
  try {
    return code.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  } catch {
    return '🌐';
  }
};

/**
 * GET /api/geo/countries
 * Live fetches all countries from MS SQL Server table [UM].[UM_Countries]
 */
export const getCountries = async (req, res) => {
  try {
    const { search } = req.query;

    let rawRows;
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      rawRows = await prisma.$queryRawUnsafe(
        `
        SELECT 
          CountryID AS id,
          RTRIM(CountryName) AS name,
          RTRIM(CountryCode) AS dialCode,
          UPPER(RTRIM(CountryISO)) AS code,
          RTRIM(CountryCurrency) AS currency
        FROM [UM].[UM_Countries]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
          AND (CountryName LIKE @P1 OR CountryISO LIKE @P1 OR CountryCode LIKE @P1)
        ORDER BY CountryName ASC
        `,
        pattern
      );
    } else {
      rawRows = await prisma.$queryRawUnsafe(
        `
        SELECT 
          CountryID AS id,
          RTRIM(CountryName) AS name,
          RTRIM(CountryCode) AS dialCode,
          UPPER(RTRIM(CountryISO)) AS code,
          RTRIM(CountryCurrency) AS currency
        FROM [UM].[UM_Countries]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
        ORDER BY CountryName ASC
        `
      );
    }

    const countries = rawRows.map((r) => {
      const dial = r.dialCode ? (r.dialCode.startsWith('+') ? r.dialCode : `+${r.dialCode}`) : '';
      return {
        id: r.id,
        code: r.code || 'US',
        name: r.name,
        flag: isoToFlag(r.code),
        dialCode: dial,
        currency: r.currency || 'USD',
      };
    });

    return res.json({ success: true, count: countries.length, countries });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve countries from database:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve country data from database' });
  }
};

/**
 * GET /api/geo/provinces (and /api/geo/states)
 * Returns all states/provinces for a country by countryCode (ISO) or countryId
 * If MS SQL Server does not have provinces for the country, falls back to country-state-city
 */
export const getProvinces = async (req, res) => {
  try {
    const countryCode = (req.query.countryCode || req.params.countryCode || '').trim();
    const countryId = req.query.countryId;
    let cleanIso = countryCode ? countryCode.toUpperCase() : '';

    let targetCountryId = countryId && !isNaN(Number(countryId)) ? Number(countryId) : null;

    if (!targetCountryId && cleanIso) {
      const cRow = await prisma.$queryRawUnsafe(
        `SELECT TOP 1 CountryID, UPPER(RTRIM(CountryISO)) AS code FROM [UM].[UM_Countries] WHERE UPPER(CountryISO) = @P1`,
        cleanIso
      );
      if (cRow && cRow.length > 0) {
        targetCountryId = cRow[0].CountryID;
        cleanIso = cRow[0].code || cleanIso;
      }
    } else if (targetCountryId && !cleanIso) {
      const cRow = await prisma.$queryRawUnsafe(
        `SELECT TOP 1 UPPER(RTRIM(CountryISO)) AS code FROM [UM].[UM_Countries] WHERE CountryID = @P1`,
        targetCountryId
      );
      if (cRow && cRow.length > 0) {
        cleanIso = cRow[0].code || '';
      }
    }

    let provinces = [];
    if (targetCountryId) {
      provinces = await prisma.$queryRawUnsafe(
        `
        SELECT 
          ProvinceID AS id,
          RTRIM(ProvinceName) AS name,
          RTRIM(ProvinceCode) AS code,
          PK_Country_ID AS countryId
        FROM [UM].[UM_Provinces]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
          AND PK_Country_ID = @P1
        ORDER BY ProvinceName ASC
        `,
        targetCountryId
      );
    }

    // If database returned provinces, return them
    if (provinces && provinces.length > 0) {
      return res.json({
        success: true,
        count: provinces.length,
        provinces: provinces.map((p) => ({
          id: p.id,
          name: p.name.trim(),
          code: p.code ? p.code.trim() : '',
          countryId: p.countryId,
          countryCode: cleanIso,
        })),
        states: provinces.map((p) => p.name.trim()),
      });
    }

    // Fallback: Use country-state-city dataset for worldwide coverage
    if (cleanIso) {
      const cscStates = State.getStatesOfCountry(cleanIso);
      if (cscStates && cscStates.length > 0) {
        return res.json({
          success: true,
          count: cscStates.length,
          provinces: cscStates.map((s, idx) => ({
            id: `csc_${cleanIso}_${s.isoCode || idx}`,
            name: s.name,
            code: s.isoCode || '',
            countryId: targetCountryId,
            countryCode: cleanIso,
          })),
          states: cscStates.map((s) => s.name),
        });
      }
    }

    return res.json({
      success: true,
      count: 0,
      provinces: [],
      states: [],
    });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve provinces:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve provinces from database' });
  }
};

/**
 * GET /api/geo/counties
 * Returns counties for a given provinceId
 */
export const getCounties = async (req, res) => {
  try {
    const { provinceId, search } = req.query;
    const numProvId = provinceId && !isNaN(Number(provinceId)) ? Number(provinceId) : null;
    const cleanSearch = search && typeof search === 'string' && search.trim() ? `%${search.trim()}%` : null;

    let counties = [];
    if (numProvId && cleanSearch) {
      counties = await prisma.$queryRawUnsafe(
        `
        SELECT CountyID AS id, RTRIM(CountyName) AS name, RTRIM(CountyCode) AS code, ProvinceID AS provinceId
        FROM [UM].[UM_Counties]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL) AND ProvinceID = @P1 AND CountyName LIKE @P2
        ORDER BY CountyName ASC
        `,
        numProvId,
        cleanSearch
      );
    } else if (numProvId) {
      counties = await prisma.$queryRawUnsafe(
        `
        SELECT CountyID AS id, RTRIM(CountyName) AS name, RTRIM(CountyCode) AS code, ProvinceID AS provinceId
        FROM [UM].[UM_Counties]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL) AND ProvinceID = @P1
        ORDER BY CountyName ASC
        `,
        numProvId
      );
    } else if (cleanSearch) {
      counties = await prisma.$queryRawUnsafe(
        `
        SELECT CountyID AS id, RTRIM(CountyName) AS name, RTRIM(CountyCode) AS code, ProvinceID AS provinceId
        FROM [UM].[UM_Counties]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL) AND CountyName LIKE @P1
        ORDER BY CountyName ASC
        `,
        cleanSearch
      );
    } else {
      counties = await prisma.$queryRawUnsafe(
        `
        SELECT CountyID AS id, RTRIM(CountyName) AS name, RTRIM(CountyCode) AS code, ProvinceID AS provinceId
        FROM [UM].[UM_Counties]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
        ORDER BY CountyName ASC
        `
      );
    }

    return res.json({
      success: true,
      count: counties.length,
      counties: counties.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || '',
        provinceId: c.provinceId,
      })),
    });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve counties:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve counties from database' });
  }
};

/**
 * GET /api/geo/cities
 * Returns complete cities for a given provinceId or search keyword
 * Provides complete A-Z coverage with no artificial 50-item cutoff
 */
export const getCities = async (req, res) => {
  try {
    const { provinceId, countryCode, stateCode, search, limit } = req.query;
    const maxLimit = limit && !isNaN(Number(limit)) ? Math.max(1, Math.min(Number(limit), 100000)) : 100000;

    let cities = [];

    // Case 1: provinceId is from country-state-city (e.g. csc_DE_BY)
    if (typeof provinceId === 'string' && provinceId.startsWith('csc_')) {
      const parts = provinceId.split('_');
      const cCode = (parts[1] || countryCode || '').toUpperCase();
      const sCode = (parts[2] || stateCode || '').toUpperCase();

      if (cCode && sCode) {
        const cscCities = City.getCitiesOfState(cCode, sCode);
        if (cscCities && cscCities.length > 0) {
          cities = cscCities.map((c, idx) => ({
            id: `csc_city_${idx}_${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            name: c.name,
            code: sCode,
            provinceId: provinceId,
          }));
        }
      }
    } else if (provinceId && !isNaN(Number(provinceId))) {
      // Case 2: Numeric provinceId -> Query MS SQL Server [UM].[UM_Cities]
      const numProvId = Number(provinceId);
      let sqlCities;
      if (search && typeof search === 'string' && search.trim()) {
        const prefix = `${search.trim()}%`;
        sqlCities = await prisma.$queryRawUnsafe(
          `
          SELECT TOP (${maxLimit})
            CityID AS id,
            RTRIM(CityName) AS name,
            RTRIM(CityCode) AS code,
            PK_Province_ID AS provinceId
          FROM [UM].[UM_Cities]
          WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
            AND PK_Province_ID = @P1
            AND CityName LIKE @P2
          ORDER BY CityName ASC
          `,
          numProvId,
          prefix
        );
      } else {
        sqlCities = await prisma.$queryRawUnsafe(
          `
          SELECT TOP (${maxLimit})
            CityID AS id,
            RTRIM(CityName) AS name,
            RTRIM(CityCode) AS code,
            PK_Province_ID AS provinceId
          FROM [UM].[UM_Cities]
          WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
            AND PK_Province_ID = @P1
          ORDER BY CityName ASC
          `,
          numProvId
        );
      }
      if (sqlCities && sqlCities.length > 0) {
        cities = sqlCities.map((c) => ({
          id: c.id,
          name: c.name ? c.name.trim() : '',
          code: c.code ? c.code.trim() : '',
          provinceId: c.provinceId,
        }));
      }

      // Case 2b: If SQL has 0 cities for this province, look up country & state to provide fallback cities
      if (cities.length === 0) {
        const pRows = await prisma.$queryRawUnsafe(
          `
          SELECT TOP 1 p.ProvinceName, p.ProvinceCode, UPPER(RTRIM(c.CountryISO)) AS CountryISO
          FROM [UM].[UM_Provinces] p
          INNER JOIN [UM].[UM_Countries] c ON p.PK_Country_ID = c.CountryID
          WHERE p.ProvinceID = @P1
          `,
          numProvId
        );
        if (pRows && pRows.length > 0) {
          const cIso = (pRows[0].CountryISO || '').toUpperCase();
          const pCode = (pRows[0].ProvinceCode || '').split('-').pop() || '';
          const pName = (pRows[0].ProvinceName || '').trim();

          const cscStates = State.getStatesOfCountry(cIso);
          const matchedState = cscStates.find(
            (s) => s.isoCode === pCode || s.name.toLowerCase() === pName.toLowerCase()
          );

          if (matchedState) {
            const fallbackCities = City.getCitiesOfState(cIso, matchedState.isoCode);
            if (fallbackCities && fallbackCities.length > 0) {
              cities = fallbackCities.map((c, idx) => ({
                id: `csc_fallback_${idx}`,
                name: c.name,
                code: matchedState.isoCode,
                provinceId: Number(provinceId),
              }));
            }
          }
        }
      }
    } else if (countryCode && stateCode) {
      // Case 3: Direct countryCode + stateCode lookup
      const cscCities = City.getCitiesOfState(countryCode.toUpperCase(), stateCode.toUpperCase());
      if (cscCities && cscCities.length > 0) {
        cities = cscCities.map((c, idx) => ({
          id: `csc_city_${idx}_${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: c.name,
          code: stateCode.toUpperCase(),
        }));
      }
    }

    // Apply search filter if provided
    if (search && search.trim() && cities.length > 0) {
      const q = search.trim().toLowerCase();
      cities = cities.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Ensure strict alphabetical sorting A to Z
    cities.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    return res.json({
      success: true,
      count: cities.length,
      cities,
    });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve cities:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve cities from database' });
  }
};

// Aliases
export const getStates = getProvinces;

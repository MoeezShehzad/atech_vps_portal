// ==============================================================================
// Controller: geoController.js
// Purpose: Live Geographical API querying MS SQL Server tables:
//          [UM].[UM_Countries], [UM].[UM_Provinces], [UM].[UM_Counties], [UM].[UM_Cities]
// ==============================================================================

import prisma from '../lib/prisma.js';

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

    let query = `
      SELECT 
        CountryID AS id,
        RTRIM(CountryName) AS name,
        RTRIM(CountryCode) AS dialCode,
        UPPER(RTRIM(CountryISO)) AS code,
        RTRIM(CountryCurrency) AS currency
      FROM [UM].[UM_Countries]
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
    `;

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = search.trim().replace(/'/g, "''");
      query += ` AND (CountryName LIKE '%${sanitized}%' OR CountryISO LIKE '%${sanitized}%' OR CountryCode LIKE '%${sanitized}%')`;
    }

    query += ' ORDER BY CountryName ASC';

    const rawRows = await prisma.$queryRawUnsafe(query);

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
 */
export const getProvinces = async (req, res) => {
  try {
    const countryCode = req.query.countryCode || req.params.countryCode;
    const countryId = req.query.countryId;

    let targetCountryId = countryId ? Number(countryId) : null;

    if (!targetCountryId && countryCode) {
      const cleanIso = countryCode.trim().replace(/'/g, "''");
      const cRow = await prisma.$queryRawUnsafe(
        `SELECT TOP 1 CountryID FROM [UM].[UM_Countries] WHERE CountryISO = '${cleanIso}'`
      );
      if (cRow && cRow.length > 0) {
        targetCountryId = cRow[0].CountryID;
      }
    }

    let query = `
      SELECT 
        ProvinceID AS id,
        RTRIM(ProvinceName) AS name,
        RTRIM(ProvinceCode) AS code,
        PK_Country_ID AS countryId
      FROM [UM].[UM_Provinces]
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
    `;

    if (targetCountryId) {
      query += ` AND PK_Country_ID = ${targetCountryId}`;
    }

    query += ' ORDER BY ProvinceName ASC';

    const provinces = await prisma.$queryRawUnsafe(query);

    return res.json({
      success: true,
      count: provinces.length,
      provinces: provinces.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code || '',
        countryId: p.countryId,
      })),
      states: provinces.map((p) => p.name), // String array backward compatibility
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

    let query = `
      SELECT 
        CountyID AS id,
        RTRIM(CountyName) AS name,
        RTRIM(CountyCode) AS code,
        ProvinceID AS provinceId
      FROM [UM].[UM_Counties]
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
    `;

    if (provinceId) {
      query += ` AND ProvinceID = ${Number(provinceId)}`;
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/'/g, "''");
      query += ` AND CountyName LIKE '%${sanitized}%'`;
    }

    query += ' ORDER BY CountyName ASC';

    const counties = await prisma.$queryRawUnsafe(query);

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
 * Returns cities for a given provinceId or search keyword
 */
export const getCities = async (req, res) => {
  try {
    const { provinceId, search, limit = 50 } = req.query;

    let query = `
      SELECT TOP ${Math.min(Number(limit) || 50, 200)}
        CityID AS id,
        RTRIM(CityName) AS name,
        RTRIM(CityCode) AS code,
        PK_Province_ID AS provinceId
      FROM [UM].[UM_Cities]
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
    `;

    if (provinceId) {
      query += ` AND PK_Province_ID = ${Number(provinceId)}`;
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/'/g, "''");
      query += ` AND CityName LIKE '${sanitized}%'`;
    }

    query += ' ORDER BY CityName ASC';

    const cities = await prisma.$queryRawUnsafe(query);

    return res.json({
      success: true,
      count: cities.length,
      cities: cities.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || '',
        provinceId: c.provinceId,
      })),
    });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve cities:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve cities from database' });
  }
};

// Aliases
export const getStates = getProvinces;

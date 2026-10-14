// ==============================================================================
// Controller: geoController.js
// Purpose: Live Geographical API querying MS SQL Server table [UM].[UM_Countries]
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

    let countries = [];
    try {
      const dbCountries = await prisma.uMCountry.findMany({
        where: {
          isDeleted: false,
          ...(search ? {
            OR: [
              { countryName: { contains: search } },
              { countryISO: { contains: search } },
              { countryCode: { contains: search } },
            ]
          } : {})
        },
        orderBy: { countryName: 'asc' },
      });

      if (dbCountries && dbCountries.length > 0) {
        countries = dbCountries.map((r) => {
          const dial = r.countryCode ? (r.countryCode.startsWith('+') ? r.countryCode : `+${r.countryCode}`) : '';
          return {
            id: r.countryId,
            code: r.countryISO?.trim() || 'US',
            name: r.countryName?.trim(),
            flag: isoToFlag(r.countryISO),
            dialCode: dial,
          };
        });
      }
    } catch (_) {
      // Fallback to raw query on [UM].[UM_Countries]
      let query = `
        SELECT 
          CountryID AS id,
          RTRIM(CountryName) AS name,
          RTRIM(CountryCode) AS dialCode,
          UPPER(RTRIM(CountryISO)) AS code
        FROM [UM].[UM_Countries]
        WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
      `;

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const sanitized = search.trim().replace(/'/g, "''");
        query += ` AND (CountryName LIKE '%${sanitized}%' OR CountryISO LIKE '%${sanitized}%' OR CountryCode LIKE '%${sanitized}%')`;
      }

      query += ' ORDER BY CountryName ASC';

      const rawRows = await prisma.$queryRawUnsafe(query);

      countries = rawRows.map((r) => {
        const dial = r.dialCode ? (r.dialCode.startsWith('+') ? r.dialCode : `+${r.dialCode}`) : '';
        return {
          id: r.id,
          code: r.code || 'US',
          name: r.name,
          flag: isoToFlag(r.code),
          dialCode: dial,
        };
      });
    }

    return res.json({ success: true, count: countries.length, countries });
  } catch (error) {
    console.error('[Geo API Error] Failed to retrieve countries from database:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve country data from database' });
  }
};

/**
 * GET /api/geo/states
 */
export const getStates = async (req, res) => {
  return res.json({ success: true, states: [] });
};

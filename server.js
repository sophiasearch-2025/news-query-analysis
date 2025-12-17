require("dotenv").config();
const express = require("express");
const cors = require("cors");
const client = require("./db").default;

const app = express();
app.use(cors());
app.use(express.json());

const INDEX_NAME = process.env.ELASTIC_INDEX || "noticias";
const MAX_RESULTS_FOR_JS = 1000;

const formatHit = (hit) => ({
  id: hit._id,
  score: hit._score,
  title: hit._source.title,
  text: hit._source.text,
  media_outlet: hit._source.media_outlet,
  country: hit._source.country,
  date: hit._source.date,
  url: hit._source.url,
});

const parseDateJS = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

app.get("/api/search", async (req, res) => {
  try {
    const { q, country, media_outlet, date_from, date_to, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const esQuery = {
      bool: {
        must: [],
        filter: [],
      },
    };

    if (q) {
      esQuery.bool.must.push({
        multi_match: {
          query: q,
          fields: ["title", "text"],
          fuzziness: "AUTO",
        },
      });
    } else {
      esQuery.bool.must.push({ match_all: {} });
    }

    // 2. Filtros de Elastic
    if (country) {
      esQuery.bool.filter.push({
        term: { country: country },
      });
    }

    if (media_outlet) {
      esQuery.bool.filter.push({
        term: { media_outlet: media_outlet },
      });
    }

    const result = await client.search({
      index: INDEX_NAME,
      size: MAX_RESULTS_FOR_JS,
      query: esQuery,
    });

    let processedHits = result.hits.hits.map((hit) => {
      const formatted = formatHit(hit);
      formatted._parsedDate = parseDateJS(formatted.date);
      return formatted;
    });

    processedHits = processedHits.filter((h) => h._parsedDate !== null);

    if (date_from) {
      const fromTime = new Date(date_from).getTime();
      processedHits = processedHits.filter((h) => h._parsedDate.getTime() >= fromTime);
    }
    if (date_to) {
      const toTime = new Date(date_to);
      toTime.setHours(23, 59, 59, 999);
      processedHits = processedHits.filter((h) => h._parsedDate.getTime() <= toTime.getTime());
    }

    processedHits.sort((a, b) => b._parsedDate - a._parsedDate);

    const totalFiltered = processedHits.length;
    const startIndex = (pageNum - 1) * limitNum;
    const slicedHits = processedHits.slice(startIndex, startIndex + limitNum);

    const finalData = slicedHits.map(({ _parsedDate, ...rest }) => rest);

    res.json({
      success: true,
      data: finalData,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(totalFiltered / limitNum),
      },
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/filters", async (req, res) => {
  try {
    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      aggs: {
        unique_media_outlets: {
          terms: { field: "media_outlet", size: 100 },
        },
        unique_countries: {
          terms: { field: "country", size: 50 },
        },
      },
    });

    const dateScan = await client.search({
      index: INDEX_NAME,
      size: 1000,
      _source: ["date"],
      query: { match_all: {} },
    });

    let minTime = Infinity;
    let maxTime = -Infinity;

    dateScan.hits.hits.forEach((hit) => {
      const d = parseDateJS(hit._source.date);
      if (d) {
        const time = d.getTime();
        if (time < minTime) minTime = time;
        if (time > maxTime) maxTime = time;
      }
    });

    res.json({
      success: true,
      data: {
        total_news: result.hits.total.value,
        media_outlets: result.aggregations.unique_media_outlets.buckets.map((b) => b.key),
        countries: result.aggregations.unique_countries.buckets.map((b) => b.key),
        date_range: {
          min: minTime === Infinity ? null : new Date(minTime).toISOString().split("T")[0],
          max: maxTime === -Infinity ? null : new Date(maxTime).toISOString().split("T")[0],
        },
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo filtros:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

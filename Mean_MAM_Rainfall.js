// 1. Load Kenya boundary
var kenya = ee.FeatureCollection("FAO/GAUL/2015/level0")
              .filter(ee.Filter.eq('ADM0_NAME', 'Kenya'));
Map.centerObject(kenya, 6);

// 2. Load CHIRPS daily rainfall data

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
               .filterBounds(kenya)
               .filterDate('1981-01-01', '2024-12-31');


// 3. Compute MAM (March–May) totals for each year
var years = ee.List.sequence(1981, 2024);
var mamSeason = ee.ImageCollection(
  years.map(function(y) {
    var start = ee.Date.fromYMD(y, 3, 1);
    var end = ee.Date.fromYMD(y, 6, 1);
    return chirps.filterDate(start, end).sum()
                 .set('year', y)
                 .set('system:time_start', start.millis());
  })
);

// 4. Compute long-term mean (mm)
var mamMean = mamSeason.mean().clip(kenya);

// 5. Visualization parameters

var visParams = {
  min: 0,
  max: 400,
  palette: ['#f7fbff', '#deebf7', '#9ecae1', '#3182bd', '#08519c']
};
Map.addLayer(mamMean, visParams, 'Mean MAM Rainfall (1981–2024)');


// 6. Create and add a legend


// Legend title and values
var legendTitle = 'MAM Rainfall (mm)';
var palette = visParams.palette;
var names = ['0–50', '50–100', '100–200', '200–300', '300–400+'];

// Create the legend panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Add title to legend
legend.add(ui.Label({
  value: legendTitle,
  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 6px 0',
    padding: '0'
  }
}));

// Add color and label rows
for (var i = 0; i < names.length; i++) {
  var colorBox = ui.Label('', {
    backgroundColor: palette[i],
    padding: '8px',
    margin: '0 0 4px 0'
  });
  var description = ui.Label(names[i], {margin: '0 0 4px 6px'});
  var row = ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal'));
  legend.add(row);
}

// Add the legend to the map
Map.add(legend);

// 7. Export as GeoTIFF

Export.image.toDrive({
  image: mamMean,
  description: 'LongTerm_Mean_MAM_Rainfall_1981_2024_Kenya',
  region: kenya.geometry(),
  scale: 5000,
  fileFormat: 'GeoTIFF'
});

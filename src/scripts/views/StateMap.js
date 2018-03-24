/**
 * Created by Shuo on 11/1/2017.
 * Deprecated class. the map of united states only
 */
var stateMap_spinner;

function initStateMap() {
    // trigger loader
    var target = document.getElementById('statemap-border');
    stateMap_spinner = new Spinner(opts).spin(target);
    solr_get_state_location(globalQuery);
}

function addSolrDateToStateMap(oneSerie) {
    var stateMap_dataObjs = oneSerie.results;
    stateMap_spinner.stop();
    stateMap(stateMap_dataObjs);
}

function stateMap(dataObj) {
    $('#statemap-border').find("div.spinner").remove();
    $("#statemap").empty();
    $("#statemap-legend").empty();
    //Create SVG element and append map to the SVG
    var svg = d3.select('#statemap');

    //axis
    var width = parseInt(svg.style("width"), 10);
    var height = parseInt(svg.style("height"), 10);

    var lowColor = '#BED7E5';
    var highColor = '#1B2845';
    // var scale = 400;
    // D3 Projection
    var projection = d3.geoAlbersUsa()
        .translate([width / 2, height * 0.9 / 2]) // translate to center of screen
        .scale([width * 1.2]); // scale things down so see entire US

    // Define path generator
    var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection); // tell path generator to use albersUsa projection


    //convert to csv
    var dataObjcolumns = ['state', 'value'];
    dataObj.colums = dataObjcolumns;

    // Load in my states data!
    var dataArray = [];
    for (var d = 0; d < dataObj.length; d++) {
        dataArray.push(parseFloat(dataObj[d].value))
    };
    
    var minVal = d3.min(dataArray);
    var maxVal = d3.max(dataArray);
    var ramp = d3.scaleLinear().domain([minVal, maxVal]).range([lowColor, highColor]);

    //tooltip
    var tooltip = d3.select("#statemap-map")
        .insert("div")
        .attr("class", "stateMap-tooltip")
        .style("position", "absolute")
        .style("font-size", "1em");

    // Load GeoJSON data and merge with states data
    d3.json("data/stateMap.json", function (json) {

        // Loop through each state data value in the .csv file
        for (var i = 0; i < dataObj.length; i++) {

            // Grab State Name
            var dataState = dataObj[i].state;

            // Grab data value
            var dataValue = dataObj[i].value;

            // Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {

                    // Copy the data value into the JSON
                    json.features[j].properties.value = dataValue;

                    // Stop looking through the JSON
                    break;
                }
            }
        }

        // Bind the data to the SVG and create one path per GeoJSON feature
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", 0.3)
            .style("fill", function (d) {
                return ramp(d.properties.value)
            })
            .on('mouseover', function (d) {

                tooltip.style("display", null);
                d3.select(this)
                    .style("stroke", "yellow")
                    .style("stroke-width", 3);
            })
            .on('mousemove', function (d) {
                var xPosition = d3.mouse(this)[0] + 20;
                var yPosition = d3.mouse(this)[1] - 30;
                tooltip
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .style("display", "inline-block")
                    .html(d.properties.name + "<br>" + d.properties.value + " tweets");
                tooltip.style("display", null);
            })
            .on('mouseout', function (d) {

                d3.select(this)
                    .style("stroke", "white")
                    .style("stroke-width", 0.3);
                tooltip.style("display", "none");
            });

        // add a legend
        var w = 120, h = height * 0.8;

        var key = d3.select("#statemap-legend")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "legend");

        var legend = key.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "100%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        legend.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", highColor)
            .attr("stop-opacity", 1);

        legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", lowColor)
            .attr("stop-opacity", 1);

        key.append("rect")
            .attr("width", w - 100)
            .attr("height", h)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(0,10)");

        var y = d3.scaleLinear()
            .range([h, 0])
            .domain([minVal, maxVal]);

        var yAxis = d3.axisRight(y);

        key.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(20,10)")
            .call(yAxis)
    });
}

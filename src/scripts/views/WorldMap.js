/**
 * Deprecated class. the map of united states only
 * */
/* JavaScript goes here. */

// globals used in graph
var worldMap_spinner;

function initWorldMap() {
    // trigger loader
    var target = document.getElementById('worldmap-border');
    worldMap_spinner = new Spinner(opts).spin(target);
    solr_get_place_country_code(globalQuery);
}

function addSolrDateToWorldMap(oneSerie) {
    console.log("In update WorldMap");

    var stateMap_dataObjs = oneSerie.results;
    worldMap_spinner.stop();
    worldMap(solrData2GeoData(stateMap_dataObjs));
}


function solrData2GeoData(solrData) {

    solrData.forEach(function (d) {

        var code = d['country'];
        if (countryCode.hasOwnProperty(code)) {

            d['key'] = countryCode[d['country']];
        }
    });

    return solrData;
}


function worldMap(geoData) {

    $('#worldmap-border').find("div.spinner").remove();
    $("#world-map").empty();
    $("#world-map-legend").empty();
    var mapdata = {};
    var palette = ['#009933', '#669900', '#99cc00', '#cccc00', '#c7dc09', '#edf933', '#ffcc00', '#ff9933', '#ff6600', '#ff5050'];

    // var lowColor = '#e5f5f9';
    // var highColor = '#2ca25f';
    var lowColor = '#BED7E5';
    var highColor = '#1B2845';
    var ramp;


    //tooltip
    var tooltip = d3.select("#worldmap-border")
        .insert("div")
        .attr("class", "stateMap-tooltip")
        .style("position", "absolute")
        .style("font-size", "1em");

    var width = parseInt(d3.select("#world-map").style("width"), 10);
    var height = parseInt(d3.select("#world-map").style("height"), 10);

    var minDocCount = 0, quantiles = {};

    // projection definitions
    var projection = d3.geoMercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / 2])
        .precision(.1);
    var path = d3.geoPath().projection(projection);
    var graticule = d3.geoGraticule();


    // SVG related definitions
    var svg = d3.select("#world-map")
        .append('g');

    svg.append('defs')
        .append('filter')
        .attr({'x': 0, 'y': 0, 'width': 1, 'height': 1, 'id': 'gray-background'});

    var filter = svg.select('filter');

    filter.append('feFlood')
        .attr('flood-paleteColor', '#f2f2f2')
        .attr('result', 'COLOR');

    filter.append('feMorphology')
        .attr('operator', 'dilate')
        .attr('radius', '.9')
        .attr('in', 'SourceAlpha')
        .attr('result', 'MORPHED');

    filter.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'MORPHED')
        .attr('result', 'COMP1');

    filter.append('feComposite')
        .attr('in', 'COMP1')
        .attr('in2', 'COLOR');

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);


    draw(geoData);

    function draw(data) {

        d3.json('./data/world.json', function (error, world) {

            if (error) {
                return console.error(error);
            }
            processWorldD(world, data);
        });
    }

    function processWorldD(world, data) {

        for (var idx = 0; idx < geoData.length; idx++) {
            if (data[idx].hasOwnProperty('key')) {

                var cCode = data[idx].key.toUpperCase();
                var doc_count = data[idx].value;
                for (var wdx = 0; wdx < world.objects.subunits.geometries.length; wdx++) {
                    var cName = world.objects.subunits.geometries[wdx].id.toUpperCase();
                    if (cCode === cName) {
                        world.objects.subunits.geometries[wdx].properties.doc_count = doc_count;
                    }
                }
            }
        }

        var subunits = topojson.feature(world, world.objects.subunits);
        subunits.features = subunits.features.filter(function (d) {
            return d.id !== "ATA";
        });

        minDocCount = d3.min(subunits.features, function (d) {
            return d.properties.doc_count;
        });

        var doc_counts = subunits.features.map(function (d) {
            return d.properties.doc_count;
        });

        doc_counts = doc_counts.filter(function (d) {
            return d;
        }).sort(d3.ascending);

        var minCount = doc_counts.reduce(function (a, b) {
            return Math.min(a, b);
        });

        var maxCount = doc_counts.reduce(function (a, b) {
            return Math.max(a, b);
        });

        ramp = d3.scaleLinear().domain([minCount, maxCount]).range([lowColor, highColor]);

        quantiles['0.95'] = d3.quantile(doc_counts, '0.95');

        var countries = svg.selectAll('path.subunit')
            .data(subunits.features).enter();
        countries.insert('path', '.graticule')
            .attr('class', function (d) {
                return 'subunit ca' + d.id;
            })
            .style('fill', heatColor)
            .attr('d', path)
            .on('mouseover', mouseoverLegend)
            .on('mousemove', function (d) {

                var xPosition = d3.mouse(this)[0] + 20;
                var yPosition = d3.mouse(this)[1] - 30;

                tooltip
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .style("display", "inline-block")
                    .html(d.properties.name + "<br>" + d.properties.doc_count + " tweets");

                tooltip.style("display", null);
            })
            .on('mouseout', mouseoutLegend)
            .on('click', coutryclicked);

        countries.append('svg:text')
            .attr('class', function (d) {
                return 'subunit-label la' + d.id + d.properties.name.replace(/[ \.#']+/g, '');
            })
            //.attr('transform', function(d) { return 'translate('+ path.centroid(d) +')'; })
            .attr('transform', function (d) {
                return 'translate(' + (width - (5 * d.properties.name.length)) + ',' + (15) + ')';
            })
            .attr('dy', '.35em')
            .attr('filter', 'url(#gray-background)')
            .append('svg:tspan')
            .attr('x', 0)
            .attr('dy', 5)
            .text(function (d) {
                return d.properties.name;
            })
            .append('svg:tspan')
            .attr('x', 0)
            .attr('dy', 20)
            .text(function (d) {
                return d.properties.doc_count ? d.properties.doc_count : '';
            });
    }

    function mouseoverLegend(d, index) {

        console.log("in mouseoverLegend");


        d3.selectAll('.subunit-label.la' + d.id + d.properties.name.replace(/[ \.#']+/g, ''))
            .style('display', 'inline-block');

        d3.selectAll('.subunit.ca' + d.id)
            .style('fill', '#cc6699');


        tooltip.style("display", null);
        // var xPosition = d3.mouse(this)[0] + 20;
        // var yPosition = d3.mouse(this)[1] - 30;
        // 		tooltip
        // 			.style("left", xPosition + "px")
        // 			.style("top", yPosition + "px")
        // 			.style("display", "inline-block")
        // 			.html(d.properties.name + "<br>" + d.properties.value + " tweets");

        // tooltip.style("display", null);


    }

    function mouseoutLegend(datum, index) {

        tooltip.style("display", "none");

        d3.selectAll('.subunit-label.la' + datum.id + datum.properties.name.replace(/[ \.#']+/g, ''))
            .style('display', 'none');

        d3.selectAll('.subunit.ca' + datum.id)
            .style('fill', heatColor(datum));
    }

    function coutryclicked(datum, index) {
        //filter event for this country should be applied here
        console.log('coutryclicked datum', datum);
    }

    function heatColor(d) {

        if (!d.properties.doc_count) {
            return lowColor;
        }

        return ramp(d.properties.doc_count);

    }

}

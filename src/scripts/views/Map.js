var m_width = parseInt(d3.select("#map").style("width"), 10),
    width = 938,
    height = 500,
    // width = parseInt(d3.select("#world-map").style("width"), 10),
    // height = parseInt(d3.select("#world-map").style("height"), 10),
    country,
    state;

var projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath()
    .projection(projection);


//tooltip
// var tooltip = d3.select("#map")
//     .insert("div")
//     .attr("class", "Map-tooltip")
//     .style("position", "absolute")
//     .style("font-size", "1em");
//

// globals used in graph
var Map_spinner;

function initMap() {
    // trigger loader
    var target = document.getElementById('map-border');
    Map_spinner = new Spinner(opts).spin(target);
    solr_get_place_country_code(globalQuery);
    solr_get_state_location(globalQuery);
}

function addSolrDateToMap(oneSerie) {
    var stateMap_dataObjs = oneSerie.results;
    Map_spinner.stop();
    Map(solrData2GeoData(stateMap_dataObjs));
}

var stateData;
var stateDataNotUpdated = true;

function addStateDataToMap(oneSerie) {
    stateData = oneSerie.results;
    
    stateDataNotUpdated = true;
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


function Map(geoData) {
    $('#map-border').find("div.spinner").remove();
    $("#map").empty();
    $("#map-legend").empty();
    //Create SVG element and append map to the SVG
   
    
    
    // var lowColor = '#BED7E5';
    var lowColor = '#deebf7';
    var highColor = '#3182bd';
    // var highColor = '#1B2845';
    
    var tooltip = d3.select("#map-border")
        .insert("div")
        .attr("class", "stateMap-tooltip")
        .style("position", "absolute")
        .style("font-size", "1em");
    
    
    var svg = d3.select("#map")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", m_width)
        .attr("height", m_width * height / width);
    
    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", country_clicked);
    
    var g = svg.append("g");
    
    
    var dataArray = [];
    geoData = geoData.reduce(function (map, obj) {
        if (obj.country.length > 0) {
            map[obj.key] = obj.value;
            dataArray.push(parseFloat(obj.value));
        }
        return map;
    }, {});
    
    
    var minVal = d3.min(dataArray);
    var maxVal = d3.max(dataArray);
    
    var ramp = d3.scaleLinear().domain([minVal, maxVal]).range([lowColor, highColor]);
    
    
    d3.json("./data/countries.topo.json", function (error, us) {
        
        g.append("g")
            .attr("id", "countries")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.countries).features)
            .enter()
            .append("path")
            .attr("id", function (d) {
                return d.id;
            })
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", 0.3)
            .style("fill", function (d) {
                if (geoData.hasOwnProperty(d.id)) {
                    d.value = geoData[d.id];
                    return ramp(d.value);
                } else {
                    d.value = 0.0;
                    return '#bdbdbd'
                }
            })
            .on("click", country_clicked)
            .on('mouseover', function (d) {
                
                tooltip.style("display", null);
                d3.select(this)
                    .style("stroke", "yellow")
                    .style("stroke-width", 3);
            })
            .on('mousemove', function (d) {
    
                var pos = get_xyz(d);
                
                var xPosition = d3.mouse(this)[0] - 20;
                // var xPosition = pos[0];
                var yPosition = d3.mouse(this)[1] + 30;
                // var yPosition = pos[1];
                
                xPosition = xPosition / 2.2 + 30;
                yPosition = yPosition / 2.0;
                
                tooltip
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .style("display", "inline-block")
                    .html(d.id + "<br>" + d.value + " tweets");
                tooltip.style("display", null);
            })
            .on('mouseout', function (d) {
                
                d3.select(this)
                    .style("stroke", "white")
                    .style("stroke-width", 0.3);
                tooltip.style("display", "none");
            });
        
        
    });
    
    
    function zoom(xyz) {
        g.transition()
            .duration(750)
            .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")")
            .selectAll(["#countries", "#states", "#cities"])
            .style("stroke-width", 1.0 / xyz[2] + "px")
            .selectAll(".city")
            .attr("d", path.pointRadius(20.0 / xyz[2]));
    }
    
    function get_xyz(d) {
        var bounds = path.bounds(d);
        var w_scale = (bounds[1][0] - bounds[0][0]) / width;
        var h_scale = (bounds[1][1] - bounds[0][1]) / height;
        var z = .96 / Math.max(w_scale, h_scale);
        var x = (bounds[1][0] + bounds[0][0]) / 2;
        var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
        return [x, y, z];
    }
    
    
    function country_clicked(d) {
        
        if (stateDataNotUpdated) {
            
            stateData = stateData.reduce(function (map, obj) {
                map[obj.state] = obj.value;
                return map;
            }, {});
            stateDataNotUpdated = false;
        }
        
        g.selectAll(["#states", "#cities"]).remove();
        state = null;
        
        if (country) {
            g.selectAll("#" + country.id).style('display', null);
        }
        
        var xyz;
        if (d && country !== d) {
            xyz = get_xyz(d);
            country = d;
            
            if (d.id === 'USA') {
                d3.json("./data/states_" + d.id.toLowerCase() + ".topo.json", function (error, us) {
                    
                    g.append("g")
                        .attr("id", "states")
                        .selectAll("path")
                        .data(topojson.feature(us, us.objects.states).features)
                        .enter()
                        .append("path")
                        .attr("id", function (d) {
                            return d.id;
                        })
                        .attr("class", "active")
                        .attr("d", path)
                        .style("fill", function (d) {
                            
                            if (d.value === 0) {
                                return '#bdbdbd'
                            }
                            
                            d.name = d.properties.name;
                            d.value = stateData[d.name];
                            return ramp(d.value);
                        })
                        .on("click", state_clicked)
                        .on('mouseover', function (d) {
                            
                            
                            tooltip.style("display", null);
                            d3.select(this)
                                .style("stroke", "yellow")
                                .style("stroke-width", 3);
                        })
                        .on('mousemove', function (d) {
                            
                            var xPosition = d3.mouse(this)[0] + 60;
                            var yPosition = d3.mouse(this)[1] - 80;
                            tooltip
                                .style("left", xPosition + "px")
                                .style("top", yPosition + "px")
                                .style("display", "inline-block")
                                .html(d.name + "<br>" + d.value + " tweets");
                            tooltip.style("display", null);
                        })
                        .on('mouseout', function (d) {
                            
                            d3.select(this)
                                .style("stroke", "white")
                                .style("stroke-width", 0.3);
                            tooltip.style("display", "none");
                        });
                    
                    zoom(xyz);
                    g.selectAll("#" + d.id).style('display', 'none');
                });
            } else {
                zoom(xyz);
            }
        } else {
            xyz = [width / 2, height / 1.5, 1];
            country = null;
            zoom(xyz);
        }
    }
    
    function state_clicked(d) {
        g.selectAll("#cities").remove();
        
        if (d && state !== d) {
            var xyz = get_xyz(d);
            state = d;
            
            country_code = state.id.substring(0, 3).toLowerCase();
            state_name = state.properties.name;
            
            d3.json("./data/cities_" + country_code + ".topo.json", function (error, us) {
                g.append("g")
                    .attr("id", "cities")
                    .selectAll("path")
                    .data(topojson.feature(us, us.objects.cities).features.filter(function (d) {
                        return state_name === d.properties.state;
                    }))
                    .enter()
                    .append("path")
                    .attr("id", function (d) {
                        return d.properties.name;
                    })
                    .attr("class", "city")
                    .attr("d", path.pointRadius(20 / xyz[2]));
                
                zoom(xyz);
            });
        } else {
            state = null;
            country_clicked(country);
        }
    }
    
    
}


// $(window).resize(function () {
//     var w = $("#map").width();
//     svg.attr("width", w);
//     svg.attr("height", w * height / width);
// });

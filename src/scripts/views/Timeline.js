/**
 * Created by Shuo on 10/25/2017.
 */

var timeline_dataObjs = [];
var timeline_spinner;
var timeline_keys;
var timeline_tobereceived;
var timeline_desired_tics = 11;

function initTimeLine() {

    // trigger loader
    var target = document.getElementById('timeline_border');
    timeline_spinner = new Spinner(opts).spin(target);

    timeline_dataObjs = [];
    timeline_keys = [];
    if ($('#timeline-checkbox').is(':checked')) {
        globalQueryHistory.forEach(function (d) {
            timeline_keys.push(d);
        });
    } else {
        timeline_keys.push(globalQuery);
    }
    timeline_tobereceived = {};
    timeline_keys.forEach(function (d) {
        timeline_tobereceived[d] = false;
    });
    timeline_keys.forEach(function (k) {
        solr_get_timeline(k, timeline_desired_tics);
    });
}

function addSolrDataToTimeline(oneSerie) {
    oneSerie.forEach(function (d) {
        if (timeline_keys.indexOf(d.key) !== -1) {
            timeline_dataObjs.push(d);
        }
        timeline_tobereceived[oneSerie[0].key] = true;
    });
    if (allTimelineDataReceived()) {
        timeline_spinner.stop();
        timeline(timeline_dataObjs);
    }
}

function allTimelineDataReceived() {
    for (var key in timeline_tobereceived) {
        if (timeline_tobereceived[key] === false) {
            return false;
        }
    }
    return true;
}

function timeline(dataObjs) {
    $('#timeline_border').find("div.spinner").remove();
    //remove all for repainting
    $("#timeline").empty();
    var svg = d3.select('#timeline');
    //axis
    var parse = d3.isoParse;
    var margin = {top: 20, right: 60, bottom: 20, left: 60};
    var width = parseInt(svg.style("width"), 10) - margin.left - margin.right;
    var height = parseInt(svg.style("height"), 10) - margin.top - margin.bottom;
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    var z = d3.scaleOrdinal(d3.schemeCategory20c);
    var xAxis = d3.axisBottom().scale(x);
    var yAxis = d3.axisLeft().scale(y);
    var yAxis2 = d3.axisRight().scale(y);

    //draw the stream view
    var area = d3.area()
        .curve(d3.curveCardinal)
        .x(function (d) {
            return x(d.date)
        })
        .y0(function (d) {
            return y(d.coords[0])
        })
        .y1(function (d) {
            return y(d.coords[1])
        });

    dataObjs.forEach(function (d) {
        d.value = Number(d.value);
        d.date = parse(d.date);
        // d.date = new Date(new Date(d.date) + new Date().getTimezoneOffset() * 60 * 1000);
    });
    var layers = prepareData(dataObjs)

    x.domain(d3.extent(dataObjs, function (d) {
        return d.date
    }));

    y.domain([
        d3.min(dataObjs, function (d) {
            return d.coords[0]
        }),
        d3.max(dataObjs, function (d) {
            return d.coords[1]
        })
    ]);

    svg = d3.select('#timeline')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var tooltip = d3.select('#timeline')
        .append("svg")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", height + margin.top + margin.bottom + "px")
        .style("top", (margin.top + 25) + "px")
        .style("bottom", "0px")
        .style("left", "0px")
        .style("background", "#333")
        .style("visibility", "hidden");

    //tooltip
    var tooltip2 = d3.select("#timeline")
        .insert("div")
        .attr("class", "stateMap-tooltip")
        .style("position", "absolute")
        .style("font-size", "1em");

    svg.selectAll('.layer')
        .data(layers)
        .enter().append('path')
        .attr('class', 'layer')
        .attr('d', function (d) {
            return area(d.values)
        })
        .style('fill', function (d, i) {
            return z(i);
        })
        .on("mouseover", function (d, i) {
            svg.selectAll(".layer").transition()
                .duration(250)
                .attr("opacity", function (d, j) {
                    return j !== i ? 0.6 : 1;
                });
            tooltip.style("visibility", "visible");
            tooltip2.style("display", null);
        })
        .on("mouseout", function (d, i) {
            svg.selectAll(".layer")
                .transition()
                .duration(250)
                .attr("opacity", "1");
            d3.select(this)
                .classed("hover", false)
                .attr("stroke-width", "0px");
            tooltip.style("visibility", "hidden");
            tooltip2.style("display", "none");
        })
        .on("mousemove", function (d, i) {
            var mousex = d3.mouse(this)[0];
            var mousey = d3.mouse(this)[1];
            var invertedx = x.invert(mousex);
            var selected = (d.values);
            var closestIndex = 0;
            var minIndex = Number.MAX_VALUE;
            for (var k = 0; k < selected.length; k++) {
                var diff = Math.abs(selected[k].date - invertedx);
                if (minIndex > diff) {
                    minIndex = diff;
                    closestIndex = k;
                }
            }
            var dateToShowInfo = selected[closestIndex];

            tooltip
                .style("left", (mousex + margin.left + 5) + "px")
                .style("visibility", "visible");

            tooltip2.style("display", null);

            tooltip2
                .style("left", (mousex + 80) + "px")
                .style("top", mousey + "px")
                .style("display", "inline-block")
                .html("Word \'" + dateToShowInfo.key + "\' <br> appears " +
                    dateToShowInfo.value + " <br> at " + getTimeString(dateToShowInfo.date));

        });

    svg.append("text")
        .attr("dy", "0.32em")
        .attr("font-size", 15)
        .text(numberWithCommas(dataObjs.sumAttr('value')) + ' tweets')
        .attr("x", function (d) {
            return width / 2 - this.getComputedTextLength() / 2;
        })
        .attr("y", 0);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + width + ', 0)')
        .call(yAxis2);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
}

Array.prototype.sumAttr = function (prop) {
    var total = 0
    for (var i = 0, _len = this.length; i < _len; i++) {
        total += this[i][prop]
    }
    return total
}

function getTimeString(date) {
    var ampm = 'am',
        h = date.getHours(),
        m = date.getMinutes(),
        s = date.getSeconds();
    if (h >= 12) {
        if (h > 12) h -= 12;
        ampm = 'pm';
    }

    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return date.toLocaleDateString() + ' ' + h + ':' + m + ':' + s + ' ' + ampm;
}

function prepareData(data) {
    var nestedByDate = d3.nest()
        .key(function (d) {
            return d.date
        })
        .entries(data);
    var nestedByKey = d3.nest()
        .key(function (d) {
            return d.key
        })
        .entries(data);

    var keys = nestedByKey.map(function (d) {
        return d.key
    });

    var stack = d3.stack()
        .offset(d3.stackOffsetSilhouette) // wiggle
        .value(function (d, k) {
            return d.values.filter(function (d) {
                return d.key == k;
            })[0].value
        })
        .keys(keys);

    var result = stack(nestedByDate);

    nestedByKey.forEach(function (d, i) {
        d.values.forEach(function (v, j) {
            v.coords = result[i][j]
        })
    });
    return nestedByKey;
}
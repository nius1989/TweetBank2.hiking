/**
 * Created by Shuo on 10/28/2017.
 */

var barchart_spinner;
var barchart_dataObjs = [];
var barchart_keys;
var barchart_tobereceived = {};
var barchart_facet_feild = field_user_followers_count;
var barchart_charttype = "bar";

function updateBarChart(field) {
    barchart_facet_feild = getAttributeByIndex(field);
    initBarChart();
}

function updateBarChartType(key) {
    if (key === 'bar') {
        barchart_charttype = 'bar';
        document.getElementById('barchart-pie').checked = false;
        document.getElementById('barchart-bar').checked = true;
        $('#barchart-bar-label').toggleClass('active', true);
        $('#barchart-pie-label').toggleClass('active', false);

    } else if (key === 'pie') {
        barchart_charttype = 'pie';
        document.getElementById('barchart-pie').checked = true;
        document.getElementById('barchart-bar').checked = false;
        $('#barchart-bar-label').toggleClass('active', false);
        $('#barchart-pie-label').toggleClass('active', true);
    }
    initBarChart();
}

function initBarChart() {
    // trigger loader
    var target = document.getElementById('barchart-tooltip');
    barchart_spinner = new Spinner(opts).spin(target);
    //init data to be received
    barchart_dataObjs = [];
    barchart_keys = [];
    if ($('#barchart-checkbox').is(':checked')) {
        globalQueryHistory.forEach(function (d) {
            barchart_keys.push(d);
        });
    } else {
        barchart_keys.push(globalQuery);
    }
    barchart_tobereceived = {};
    barchart_keys.forEach(function (d) {
        barchart_tobereceived[d] = false;
    });
    barchart_keys.forEach(function (k) {
        solr_get_user_info(k, barchart_facet_feild);
    });
}

function addSolrDataToBarChart(oneSerie) {

    if (barchart_keys.indexOf(oneSerie.key) !== -1) {
        barchart_dataObjs.push(oneSerie);
    }
    barchart_tobereceived[oneSerie.key] = true;
    if (allBarChartDataReceived()) {
        if (barchart_charttype === 'bar') {
            bar(barchart_dataObjs);

        } else if (barchart_charttype === 'pie') {
            pie(barchart_dataObjs);
        }
    }
}

function allBarChartDataReceived() {
    for (var key in barchart_tobereceived) {
        if (barchart_tobereceived[key] === false) {
            return false;
        }
    }
    return true;
}


function bar(dataObj) {
    $('#barchart-tooltip').find("div.spinner").remove();
    $('#barchart-tooltip').find("div.barchart-tip").remove();
    $("#barchart").empty();
    // create the svg
    var svg = d3.select("#barchart");
    var margin = {top: 40, right: 50, bottom: 50, left: 40};
    var width = parseInt(svg.style("width"), 10) - margin.left - margin.right;
    var height = parseInt(svg.style("height"), 10) - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // set x scale
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.2)
        .align(0.1);

    // set y scale
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    // set the colors
    // var z = d3.scaleOrdinal().range(colorrange);

    var z = d3.scaleOrdinal(d3.schemeCategory20);

    //convert to csv
    var one = dataObj[0];
    var columns = [];
    for (var key in one) {
        columns.push(key);
    }
    dataObj.columns = columns;

    //add total
    dataObj.forEach(function (d) {
        var t = 0;
        for (var key in d) {
            if (key !== "key") {
                t += d[key];
            }
        }
        d.total = t;
        return d;
    });

    //generate keys
    var keys = dataObj.columns.slice(1);

    dataObj.sort(function (a, b) {
        return b.total - a.total;
    });

    x.domain(dataObj.map(function (d) {
        return d.key;
    }));
    y.domain([0, d3.max(dataObj, function (d) {
        return d.total;
    })]).nice();
    z.domain(keys);


// Prep the tooltip bits, initial display is hidden
    var tooltip = d3.select("#barchart-tooltip")
        .insert("div")
        .attr("class", "barchart-tip")
        .style("position", "absolute")
        .style("font-size", "1em");

    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(dataObj))
        .enter().append("g")
        .attr("fill", function (d) {
            return z(d.key);
        })
        .selectAll("rect")
        .data(function (d) {
            return d;
        })
        .enter().append("rect")
        .attr("x", function (d) {
            return x(d.data.key);
        })
        .attr("y", function (d) {
            return y(d[1]);
        })
        .attr("height", function (d) {
            return y(d[0]) - y(d[1]);
        })
        .attr("width", x.bandwidth())
        .on("mouseover", function () {
            tooltip.style("display", null);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .on("mousemove", function (d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1];
            var stackValue = 0;
            var pointedKey = "";
            for (var key in d.data) {
                if (key !== 'key') {
                    pointedKey = key;
                    stackValue += d.data[key];
                    if (stackValue > d[0]) {
                        break;
                    }
                }
            }
            tooltip
                .style("left", (xPosition + 60) + "px")
                .style("top", (yPosition + 30) + "px")
                .style("display", "inline-block")
                .html(barchart_facet_feild + "[" + pointedKey + "]:<br>"
                    + numberWithCommas(d[1] - d[0]) + " users");
        });

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .style("font", "14px times")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.5em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start");


    var stackedValue = d3.stack().keys(keys)(dataObj);
    var stackTop = stackedValue[stackedValue.length - 1];

    g.append('g')
        .attr("font-family", "sans-serif")
        .attr("font-size", 15)
        .attr("text-anchor", "end")
        .selectAll('text')
        .data(stackTop)
        .enter()
        .append("text")
        .text(function (d, i) {
            return numberWithCommas(dataObj[i].total) + " twitters";
        })
        .attr("x", function (d) {
            return x(d.data.key) + x.bandwidth() / 2 + this.getComputedTextLength() / 2;
        })
        .attr("y", function (d) {
            return y(d[1]) - 20;
        });

    g.append("text")
        .attr("x", -30)
        .attr("y", -10)
        .text("num of users");

    var legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", width + 5)
        .attr("y", -20)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width)
        .attr("y", -10.5)
        .attr("dy", "0.32em")
        .text(function (d) {
            return d;
        });
}

function pie(dataObj) {
    $('#barchart-tooltip').find("div.spinner").remove();
    $("#barchart").empty();
    var svg = d3.select("#barchart");
    var width = parseInt(svg.style("width"), 10);
    var height = parseInt(svg.style("height"), 10);
    var radius = (Math.min(width, height) / 2) - 50;


    var x = d3.scaleLinear()
        .range([0, 2 * Math.PI]);

    var y = d3.scaleSqrt()
        .range([0, radius]);

    // set the colors
    var z = d3.scaleOrdinal(d3.schemeCategory20);
    var z2 = d3.scaleOrdinal(d3.schemeCategory20c);
    var partition = d3.partition();

    var arc = d3.arc()
        .startAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
        })
        .endAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
        })
        .innerRadius(function (d) {
            return Math.max(0, y(d.y0));
        })
        .outerRadius(function (d) {
            return Math.max(0, y(d.y1));
        });


    svg = d3.select("#barchart")
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    //convert the data into nested form
    var jsonObj = {
        name: "tweets"
    };
    var children = [];
    for (var i = 0; i < dataObj.length; i++) {
        var child = {
            name: dataObj[i].key
        };
        var grandChildren = [];
        for (var key in dataObj[i]) {
            if (key !== 'key' && dataObj[i][key] !== 0) {
                var grandchild = {
                    name: key,
                    size: dataObj[i][key],
                    color: z(key)
                };
                grandChildren.push(grandchild);
            }
        }
        child['children'] = grandChildren;
        children.push(child);
    }
    jsonObj.children = children;
    var text;
    var root = d3.hierarchy(jsonObj);
    root.sum(function (d) {
        return d.size;
    });

    svg.selectAll("path")
        .data(partition(root).descendants())
        .enter().append("g").attr("class", "node");

    svg.selectAll(".node")
        .append("path")
        .attr("stroke", "#fff")
        .attr("d", arc)
        .style("fill", function (d) {
            if (!d.children) {
                return d.data.color;
            } else if (!d.parent) {
                return "#eef"
            } else {
                return z2(d.data.name);
            }
        })
        .on("click", piechart_click);

    text = svg.selectAll(".node")
        .append("text")
        .attr("transform", function (d) {
            return "rotate(" + computeTextRotation(d) + ")";
        })
        .attr("x", function (d) {
            return y(d.y0);
        })
        .attr("dx", "0") // margin
        .attr("dy", ".15em") // vertical-align
        .text(function (d) {
            return d.data.name === "tweets" ? "" : d.data.name;
        });

    function piechart_click(d) {
        //Hide text while Sunburst transitions
        text.transition().attr("opacity", 0);

        svg.transition()
            .duration(750)
            .tween("scale", function () {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                return function (t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                };
            })
            .selectAll("path")
            .attrTween("d", function (d) {
                return function () {
                    return arc(d);
                };
            })
            .on("end", function (e, i) {
                // check if the animated element's data e lies within the visible angle span given in d
                if (e.x0 >= d.x0 && e.x0 < d.x1) {
                    // get a selection of the associated text element
                    var arcText = d3.select(this.parentNode).select("text");
                    // fade in the text element and recalculate positions
                    arcText.transition().duration(750)
                        .attr("opacity", 1)
                        .attr("class", "visible")
                        .attr("transform", function () {
                            return "rotate(" + computeTextRotation(e) + ")"
                        })
                        .attr("x", function (d) {
                            return y(d.y0);
                        })
                        .text(function (d) {
                            return d.data.name === "tweets" ? "" : d.data.name;
                        });
                }
            });
    }

    function computeTextRotation(d) {
        return (x((d.x0 + d.x1) / 2) - Math.PI / 2) / Math.PI * 180;
    }

    d3.select(self.frameElement).style("height", height + "px");
}






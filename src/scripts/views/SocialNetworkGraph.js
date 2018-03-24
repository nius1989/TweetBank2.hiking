var socialgraph_spinner;
var socialNetwork_dataObj = {};

function initSocialGraph() {
    if (!debugMode) {//social network requires running on the server
        var target = document.getElementById('graph-border');
        socialgraph_spinner = new Spinner(opts).spin(target);
        socialNetwork_dataObj = {};
        solr_get_social_network(globalQuery);
    }
}

//This method is called in PHPRouter.js
function addSolrDataToSocialLink(oneSerie) {
    socialgraph_spinner.stop();
    var json = String(JSON.stringify(oneSerie));
    socialNetwork_dataObj = JSON.parse(json);
    socialGraph(socialNetwork_dataObj);
}

function socialGraph(graph) {
    $('#graph-border').find("div.spinner").remove();
    $("#graph").empty();
    var svg = d3.select("#graph")
        .attr("border", 1);

    var width = parseInt(svg.style("width"), 10);
    var height = parseInt(svg.style("height"), 10);
    var radius = 4.5;
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {
            return d.id;
        }))
        .force("charge", d3.forceManyBody().strength(-10))
        .force("collide", d3.forceCollide().radius(radius))
        .force("center", d3.forceCenter(width / 2, height / 2));

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", function (d) {
            return Math.sqrt(d.value);
        });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", radius)
        .attr("fill", function (d) {
            return color(d.group);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(function (d) {
            return d.name + "\n" + d.screenname;
        });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        node.attr("cx", function (d) {
            return d.x = Math.max(radius, Math.min(width - radius, d.x));
        })
            .attr("cy", function (d) {
                return d.y = Math.max(radius, Math.min(height - radius, d.y));
            });
        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });


    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
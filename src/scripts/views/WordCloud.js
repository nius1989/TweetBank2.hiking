// var fill = d3.scale.category20();
// var fill = d3.schemeCategory20;

var wordcloud_layout;
var wordcloud_spinner;

var fill = {
    hashtag: '#d9b8f1',
    at: '#BDC03F',
    noun: '#ffe543',
    verb: '#ffe543',
    'at-mention': '#FF9B14',
    discourse: '#F69AC1',
    numerical: '#8EB4FF',
    unused: '#4B0082'
};


function initWordCloud() {
// trigger loader
    var target = document.getElementById('wordcould-border');
    wordcloud_spinner = new Spinner(opts).spin(target);
}

function addSolrDataToWordCloud(oneSerie) {
    wordcloud_spinner.stop();
    wordCloud(oneSerie);
}

function wordCloud(keywords) {

    $('#wordcould-border').find("div.spinner").remove();
    var entities = [];

    Object.entries(keywords).forEach(function (keyword) {
        entities.push({"text": keyword[0], "size": keyword[1]});
    });


    var w = parseInt(d3.select("#word-cloud").style("width"), 10);
    var h = parseInt(d3.select("#word-cloud").style("height"), 10);

    wordcloud_layout = d3.layout.cloud()
        .size([w, h])
        .words(entities)
        .padding(3)
        .rotate(function () {
            return 0;
        })
        .fontSize(function (d) {
            return Math.sqrt(d.size) * 10;
        })
        .on("end", drawCloud);

    wordcloud_layout.start();

}

function drawCloud(words) {

    d3.select("#word-cloud")
        .selectAll("text")
        .remove();

    d3.select("#word-cloud")
        .attr("width", wordcloud_layout.size()[0])
        .attr("height", wordcloud_layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + wordcloud_layout.size()[0] / 2 + "," + wordcloud_layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .classed("hashtag", true)
        .style("font-size", function (d) {
            return d.size + "px";
        })
        // .style("font-family", "Impact")
        .style("fill", function (d, i) {
            // return '#d9b8f1';
            return fill['hashtag'];
        })
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function (d) {
            return d.text;
        })
        .on('click', function(d){
            
            d3.select(this).classed('highlight', true);
            console.log('the word ' + d.text + ' has been clicked');
        });
}

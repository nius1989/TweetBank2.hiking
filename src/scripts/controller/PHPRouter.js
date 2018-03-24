function callSolr(query) {
    $.ajax({
        url: 'scripts/controller/PHPRouter.php',
        type: 'GET',
        data: {"query": query},
        success: function (response) {
            eval(response);
        }
    });
}

function callJena(query) {
    $.ajax({
        url: 'scripts/controller/PHPSocialNetwork_Jena.php',
        type: 'GET',
        data: {"query": query},
        success: function (response) {
            eval(response);
        }
    });
}
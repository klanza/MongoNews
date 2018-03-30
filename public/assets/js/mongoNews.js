$(function() {
    $('#scrape').on('click', function(event) {
        $.ajax({
            method: 'GET',
            url: '/scrape',
        }).then(
            function() {
                location.reload(true);
            });
    });
});

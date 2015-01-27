.factory('helper', [

    function() {
        return {
            calcAge: function(date) {
                var ageDifMs = Date.now() - date.getTime();
                var ageDate = new Date(ageDifMs); // miliseconds from epoch
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        };
    }
])
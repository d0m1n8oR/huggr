.controller('searchCtrl', function($scope, $firebase, toast) {
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.search = {
        user: null,
        criteria: null
    }

    $scope.searchUser = function() {
        var searchCriteria = $scope.search.criteria;
        var searchValue = $scope.search.user;
        
        if(searchCriteria == "profileID" || searchCriteria == "age" || searchCriteria == "rating" || searchCriteria == "numberHuggs")
        {
            searchValue = Number(searchValue);
        }
        
        if(searchCriteria == "profileID")
        {
            searchCriteria = 'profileID';
        }
        if(searchCriteria == "displayName")
        {
            searchCriteria = 'displayName'
        }
        if(searchCriteria == "firstName")
        {
            searchCriteria = 'firstName';
        }
        if(searchCriteria == "lastName")
        {
            searchCriteria = 'lastname';
        }
        if(searchCriteria == "age")
        {
            searchCriteria = 'age';
        }
        if(searchCriteria == "rating")
        {
            searchCriteria = 'rating';
        }
        if(searchCriteria == "numberHuggs")
        {
            searchCriteria = 'numberHuggs';
        }
        if(searchCriteria == "email")
        {
            searchCriteria = 'email';
        }
        if(searchCriteria == "gender")
        {
            searchCriteria = 'gender';
        }

        if (searchCriteria == null || searchValue == null) {
            toast.pop("Enter values!");
        } else {
            console.log(searchCriteria+searchValue )
            var userObject = $firebase(ref.child("users").child("data").orderByChild(searchCriteria).equalTo(searchValue)).$asObject();
            userObject.$bindTo($scope, "userData").then(function() {
                console.log($scope.userData);
            }); // end bindTo
        }
    }

})
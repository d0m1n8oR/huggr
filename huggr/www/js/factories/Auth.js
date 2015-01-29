.factory("Auth", ["$firebaseAuth", "$state",
    function($firebaseAuth, $state) {
        var ref = new Firebase("https://huggr.firebaseio.com/");
        console.log($firebaseAuth(ref).$getAuth());
        if($firebaseAuth(ref).$getAuth() == null)
        {
            console.log("hallo");
            $state.go("index");
        }
        return $firebaseAuth(ref);
    }
])
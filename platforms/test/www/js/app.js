// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova', 'firebase', 'starter.controllers', 'app.directives.format', 'app.directives.clickToEdit', 'app.directives.focusMe', 'AngularGM'])

.run(function($ionicPlatform, $rootScope, $firebaseSimpleLogin, $firebase, angulargmContainer, $ionicLoading, $cordovaSplashscreen) {

    var start = new Date();
    // Set Firebase connection reference
    $rootScope.storesRef = new Firebase('https://steakbuddy.firebaseio.com/places');

    //Set Cuts Object
    $rootScope.cutsRef = new Firebase('https://steakbuddy.firebaseio.com/cuts');

    $rootScope.cutsRef.once('value', function(snapshot) {
        var cuts = snapshot.val();
        $rootScope.cuts = cuts;
    });
    
    // Initially set no user to be logged in
    $rootScope.user = null;
    $rootScope.sortBy = 'price';

    $rootScope.offset = new google.maps.Size(0, -30);
    var counter = 0;
    var storeCounter = 0;
    var dest = [];



    var gmapPromise = angulargmContainer.getMapPromise('infoWindows');
    //After we recieve the Google Map promise were going to get the current location and build an array of close stores
    gmapPromise.then(function(gmap) {

        //Let the user know were getting the location
        $rootScope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });

        //Use native API to the the location
        //Then run the callback function to generate an array of stores in close proximity to the pos returned
        navigator.geolocation.getCurrentPosition(function(pos) {

            $rootScope.geoloc = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);//Set geoloc to the cordinates of the device
            
            //Let the user know were getting the location
            $rootScope.loading = $ionicLoading.show({
                content: 'Loading nearby information',
                showBackdrop: false
            });
            

            //This is the request object we will use to do the google places search with
            var request = {
              location: $rootScope.geoloc, //the location of the device we found earlier
              radius: '500', // Prefered radius, if few stores are found it will search outside of the radius
              query: 'grocery' //can be any string 
            };

            var service = new google.maps.places.PlacesService(gmap); //Were using the gmap from the DOM to do the places search
            service.textSearch(request, function(results, status) { //Using an anonymous function here because this is only run once
                for (var i = 0; i < results.length; i++) {
                    //Use the firebase ref to take a snapshot of the data using the google places id ad the key
                    $rootScope.storesRef.child('ids/'+results[i].place_id).once('value', function(snapshot) {
                        storeKey = snapshot.val();
                        if(storeKey == undefined || storeKey == null) {
                            //The store is not in firebase so we'll add it
                            var storeObject = {
                                id: results[counter].place_id, 
                                name: results[counter].name,
                                hasSteaks: {strikes:0, value:true},
                                cuts: {},
                                geolocation: results[counter].geometry.location,
                                vicinity: results[counter].formatted_address 
                            }
                            angular.forEach($rootScope.cuts, function(value, key) {
                                storeObject.cuts[value] = {
                                    confirm: 1,
                                    confirmedBy: '',
                                    price: 5.99,
                                    updated: new Date().getTime()
                                };
                            });
                            var newStoresRef = ($rootScope.storesRef)
                            .child('stores')
                            .push(storeObject);
                            newStoresRef.once('value', function (snapshot) { 
                                ($rootScope.storesRef)
                                .child('ids')
                                .child(snapshot.val().id)
                                .set(snapshot.name())

                                storeKey = snapshot.name();
                                addToStores(storeKey, results.length)
                                console.log('Added ' + storeKey + ' to firebase');
                            });
                            //createMarker(storeKey, i);
                            
                        }
                        else if(counter < results.length) {
                            //The store is already in firebase so we just need to make the marker
                            //(function(storeKey){
                            addToStores(storeKey, results.length)
                            //})(storeKey);
                        }
                        counter++;
                    });
                }
            });

        }, function(error) {
            alert('Unable to get location: ' + error.message);
        });

    });


    function addToStores(storeKey, resultsLength){

        $rootScope.storesRef.child('stores/'+storeKey).once('value', function(storeSnapshot) {
            (function(storeKey){

            console.log('running addToStores(), storeKey='+storeKey+' storeCounter='+storeCounter+' resultsLength='+resultsLength)
            var storeinfo = storeSnapshot.val();

            if(storeinfo.hasSteaks.value == true && storeCounter < resultsLength){
                $rootScope.stores.push({
                    name: storeinfo.name,
                    cuts: storeinfo.cuts,
                    city: storeinfo.vicinity,
                    id: storeKey,
                    location: {lat: storeinfo.geolocation.k, lng: storeinfo.geolocation.B},
                    marker: '',
                    distance: {}
                });

                dest.push(new google.maps.LatLng(storeinfo.geolocation.k, storeinfo.geolocation.B));
            }

            storeCounter++
            if(storeCounter == resultsLength){
                var distanceService = new google.maps.DistanceMatrixService();
                distanceService.getDistanceMatrix(
                {
                    origins: [$rootScope.geoloc],
                    destinations: dest,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.IMPERIAL,
                    avoidHighways: false,
                    avoidTolls: false
                },  
                function(response, status) {
                    var origins = response.originAddresses;
                    var destinations = response.destinationAddresses;
                    var distances = [];
                    var results = response.rows[0].elements;

                    for (var j = 0; j < results.length; j++) {
                        distances[j] = {    
                                        desc: origins[0] + ' to ' + destinations[j],
                                        dist: results[j].distance.text,
                                        distM: results[j].distance.value,
                                        time: results[j].duration.text
                                        };
                        $rootScope.stores[j].distance = distances[j];
                        console.log("Added distance for" + $rootScope.stores[j].id)

                    }

                    var previousPrice;
                    var uniquePrices = 0;
                    var markerNumber;
                    var multiplier;
                    var counter =0;

                    //First we need to sort the stores by price
                    $rootScope.stores.sort(function(a, b){
                        return a.cuts[$rootScope.steak.cut].price-b.cuts[$rootScope.steak.cut].price
                    })
                    //Then we count how many unique prices there are so we can assign the correct multiplier for the marker
                    for (var i = 0; i < $rootScope.stores.length; i++){
                        if($rootScope.stores[i].cuts[$rootScope.steak.cut].price != previousPrice){
                            uniquePrices++
                            previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
                        } 
                    }

                    //Then we are going to assign color of marker based on how many unique prices there are
                    previousPrice = 0;
                    if (uniquePrices <= 4){
                        for (var i = 0; i < $rootScope.stores.length; i++){
                            multiplier = 5;
                            markerNumber = i+1;
                            
                            if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                                pin = multiplier * (counter - 1);
                            } else {
                                pin = multiplier * counter;
                                counter++;
                            }
                            $rootScope.stores[i].pin = pin;
                            $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                            previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
                                                    }
                    } else if(uniquePrices > 4 && uniquePrices <= 7){
                        for (var i = 0; i < $rootScope.stores.length; i++){
                            multiplier = 3;
                            markerNumber = i+1;
                            
                            if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                                pin = multiplier * (counter - 1);
                            } else {
                                pin = multiplier * counter;
                                counter++;
                            }
                            $rootScope.stores[i].pin = pin;
                            $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                            previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;
                                                    }
                    } else if(uniquePrices > 7 && uniquePrices <= 11){
                        for (var i = 0; i < $rootScope.stores.length; i++){
                            multiplier = 2;
                            markerNumber = i+1;
                            
                            if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                                pin = multiplier * (counter - 1);
                            } else {
                                pin = multiplier * counter;
                                counter++;
                            }
                            $rootScope.stores[i].pin = pin;
                            $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                            previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;

                        }
                    } else {
                        for (var i = 0; i < $rootScope.stores.length; i++){
                            multiplier = 1;
                            markerNumber = i+1;
                            
                            if($rootScope.stores[i].cuts[$rootScope.steak.cut].price == previousPrice){
                                pin = multiplier * (counter - 1);
                            } else {
                                pin = multiplier * counter;
                                counter++;
                            }
                            $rootScope.stores[i].pin = pin;
                            $rootScope.stores[i].marker = '<div class="pin bounce pin-'+pin+'"><div class="num">'+markerNumber+'</div></div>';
                            previousPrice = $rootScope.stores[i].cuts[$rootScope.steak.cut].price;                        }
                    }

                    /*
                    $rootScope.stores.sort(function(a, b){
                        return a.distance.distM-b.distance.distM
                    })
                    */
                    $ionicLoading.hide(); //Hide the loading alert

                    $rootScope.$apply();
                });
            }
            })(storeKey);
        });
    }
    

    $ionicPlatform.ready(function() {
        setTimeout(function() {
            $cordovaSplashscreen.hide()
        }, 100)
        if (ionic.Platform.isIOS() == true){
            $rootScope.device = 'IOS';
            $rootScope.$apply();
            console.log('isIOS');
        } 
        if (ionic.Platform.isIPad() == true){
            $rootScope.device = 'IPad';
            console.log('isIPad');
        }


        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true); //This solves the header from scrolling up on an input focus
        }
        if(window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }

        $rootScope.steak = {
            cut: 'filet',
        }
        $rootScope.stores = [];

        $rootScope.viewType = 'list';

        $rootScope.firstRun = true;
    });
})

.config(function($stateProvider, $urlRouterProvider, $provide) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.profile', {
      url: "/profile",
      views: {
        'menuContent' :{
          templateUrl: "templates/profile.html",
          controller: 'loginCtrl'
        }
      }
    })

    .state('app.browse', {
      url: "/browse",
      views: {
        'menuContent' :{
          templateUrl: "templates/browse.html",
        }
      }
    })
    .state('app.agm', {
      url: "/stores",
      views: {
        'menuContent' :{
          templateUrl: "templates/agm.html",
          controller: 'StoresCtrl'
        }
      }
    })
    .state('app.single', {
      url: "/stores/details/:storeId/:storeIndex",
      views: {
        'menuContent' :{
          templateUrl: "templates/store.html",
          controller: 'StoreCtrl'
        }
      }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/profile');

    $provide.decorator('angulargmDefaults', function($delegate) {
        return angular.extend($delegate, {
          'markerConstructor': RichMarker,
        });
    });

});


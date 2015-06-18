
(function(){
  var app = angular.module('dataQualityApp', ['ngRoute', 'dashboard', 'reportCard', 'consistencyAnalysis', 'outlierGapAnalysis', 'dataExport', 'admin', 'ui.select', 'ngSanitize', 'ui.bootstrap', 'nvd3']);
    
	/**Bootstrap*/
	angular.element(document).ready( 
		function() {
		
	  		var initInjector = angular.injector(['ng']);
	      	var $http = initInjector.get('$http');
       		
	      	$http.get('manifest.webapp').then(
	        	function(data) {
	          		app.constant("BASE_URL", data.data.activities.dhis.href);
	          		angular.bootstrap(document, ['dataQualityApp']);
	        	}
	      	);
	    }
	);
	 
	/**Config*/
	app.config(function(uiSelectConfig) {
		uiSelectConfig.theme = 'bootstrap'
		uiSelectConfig.resetSearchInput = true;
	});
	
	app.config(['$routeProvider',
	        function($routeProvider) {
	            $routeProvider.
	                when('/dashboard', {
	                    templateUrl: 'views/dashboard.html',
	                    controller: 'DashboardController',
	                    controllerAs: 'dashCtrl'
	                }).
	                when('/consistency', {
	                    templateUrl: 'views/consistencyAnalysis.html',
	                    controller: 'ConsistencyAnalysisController',
	                    controllerAs: 'aCtrl'
	                }).
	                when('/outlier_gap', {
	                    templateUrl: 'views/outlierGapAnalysis.html',
	                    controller: 'OutlierGapAnalysisController',
	                    controllerAs: 'aCtrl'
	                }).
	                when('/review', {
	                    templateUrl: 'views/review.html',
	                    controller: 'ReviewController',
	                    controllerAs: 'revCtrl'
	                    
	                }).
	                when('/export', {
	                    templateUrl: 'views/export.html',
	                    controller: 'ExportController',
	                    controllerAs: 'exportCtrl'
	                }).
	                when('/admin', {
	                    templateUrl: 'views/admin.html',
	                    controller: 'AdminController',
	                    controllerAs: 'admCtrl'
	                }).
	                otherwise({
	                    redirectTo: '/dashboard'
	                });
	        }]);
	
	
	
	/**Controller: Navigation*/
	app.controller("NavigationController", function(BASE_URL, $location, $window) {
		var self = this;
		
		self.isCollapsed = true;	
		self.navClass = function (page) {
		    var currentRoute = $location.path().substring(1) || 'dashboard';
		    return page === currentRoute ? 'active' : '';
		  };
		
		self.collapse = function() {
			if (this.isCollapsed) this.isCollapsed = false;
			else this.isCollapsed = true;
		};
		
		self.exit = function() {
			$window.open(BASE_URL, '_self');
		}

		
		return self;
	});

  		              
})();



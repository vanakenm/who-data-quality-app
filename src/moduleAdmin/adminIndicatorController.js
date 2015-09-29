(function(){  
	/**Controller: Parameters*/
	angular.module('admin').controller("ModalAddIndicatorController",
	['$modalInstance', 'groups',
	function($modalInstance, groups) {
	    	    
	    var self = this; 
	    
	    self.name = '';
	    self.definition = '';
	    self.groups = groups;
	    self.groupSelected = null;
	    
	    	    
	    self.cancel = function () {
	        $modalInstance.close();
	    };
	    
	    self.save = function () {
	    		    	
	        $modalInstance.close({'group': self.groupSelected.code, 'name': self.name, 'definition': self.definition});
	    };
	    
	}]);
})();

(function(){
	
	var app = angular.module('reportCard', []);
	
	app.controller("ReviewController", function(metaDataService, periodService, mathService, requestService, dataAnalysisService, visualisationService) {
		var self = this;    
		
	    init();

	    function init() {
	    	self.notPossible = false;
	    	self.completeness = null;
	    	
	    	self.orgunitLevels = [];
	    	self.orgunitLevelSelected = undefined;
	    	
	    	self.userOrgunit = undefined;
	    	
	    	self.years = periodService.getYears();
	    	self.years.shift();
	    	self.yearSelected = self.years[0];
	    	
	    	self.groups = [];
	    	self.groupSelected = undefined;
	    	
	    	
	    	metaDataService.getUserOrgunits().then(function(data) { 
	    		self.userOrgunit = data[0];
	    		
	    		metaDataService.getOrgunitLevels().then(function(data) { 
	    			var validLevels = [];
	    			
	    			for (var i = 0; i < data.length; i++) {
	    				if (data[i].level > self.userOrgunit.level && data[i].level <= self.userOrgunit.level+2) {
	    					validLevels.push(data[i]);
	    				}
	    			}
	    			
	    			self.orgunitLevels = validLevels;
	    			if (self.orgunitLevels.length === 0) {
	    				self.notPossible = true;
	    			}
	    		});
	    		
	    	});
	    	
	    	//Get mapped data
	    	requestService.getSingle('/api/systemSettings/DQAmapping').then(function(response) {
	    		
	    		self.map = response.data;
	    		
	    		self.groups = response.data.groups;
	    		self.groups.unshift({'name': '[ Core ]', 'code': 'C'});
	    		self.groupSelected = self.groups[0];
	    	});
	    }
	    
	  	
	  	self.doAnalysis = function() {
	  		
	  		self.completeness = {};
	  		self.completeness.indicators = [];
	  		self.consistency = {};
	  		self.consistency.outliers = [];
	  		self.consistency.consistency = [];
	  		self.consistency.relations = [];
	  		self.consistency.consistencyChart = [];
	  		
	  		var datasets = dataSetsForCompleteness();
	  		var indicatorIDs = indicatorIDsForAnalysis();
	  		
	  		var refYears = precedingYears(self.yearSelected.id, 3);
	  		
	  		//1 Get dataset completeness
	  		var dscCallback = function (result) { self.completeness.datasets = result;}
	  		dataAnalysisService.datasetCompleteness(dscCallback, dataSetsForCompleteness(), self.yearSelected.id, refYears, self.userOrgunit.id, self.orgunitLevelSelected.level);
			
			//2 Get indicator completeness
	  		var icCallback = function (result) { self.completeness.indicators.push(result);}
	  		for (var i = 0; i < indicatorIDs.length; i++) {
	  		
	  			var indicator = indicatorFromCode(indicatorIDs[i])
	  			var dataset = datasetFromID(indicator.dataSetID);
	  			
	  			var startDate = self.yearSelected.id.toString() + "-01-01";
	  			var endDate = self.yearSelected.id.toString() + "-12-31";
	  			var periods = periodService.getISOPeriods(startDate, endDate, dataset.periodType);	  			
	  			
				dataAnalysisService.indicatorCompleteness(icCallback, indicator, periods, self.userOrgunit.id, self.orgunitLevelSelected.level);
	  		}
	  		 		
	  		//3 Completeness chart
	  		var datasetIDs = [];
	  		for (var i = 0; i < datasets.length; i++) {
	  			datasetIDs.push(datasets[i].id);
	  		}
	  		var pe = precedingYears(self.yearSelected.id, 3);
	  		pe.push(self.yearSelected.id);
	  		pe.sort(function(a, b){return a-b});
	  			  		
	  		
	  		//4 Indicator outliers
	  		var coCallback = function (result) { self.consistency.outliers.push(result);}
  			for (var i = 0; i < indicatorIDs.length; i++) {
  			
  				var indicator = indicatorFromCode(indicatorIDs[i])
  				var dataset = datasetFromID(indicator.dataSetID);
  				
  				var startDate = self.yearSelected.id.toString() + "-01-01";
  				var endDate = self.yearSelected.id.toString() + "-12-31";
  				var periods = periodService.getISOPeriods(startDate, endDate, dataset.periodType);	  			
  				
  				dataAnalysisService.indicatorOutlier(coCallback, indicator, periods, self.userOrgunit.id, self.orgunitLevelSelected.level);
  			}
	
  			//5 Indicator consistency
  			var ccCallback = function (result) {
				result.chartOptions = JSON.parse(JSON.stringify(self.chartConfigurations.consistencySmall));
				result.chartData = makeDataPoints(result.datapoints, result.boundaryConsistency, result.consistency, result.chartOptions);
  				self.consistency.consistency.push(result);
  				self.consistency.consistencyChart.push(result.chartSerie);
  				
  			}
			for (var i = 0; i < indicatorIDs.length; i++) {
				
				var indicator = indicatorFromCode(indicatorIDs[i]);  			
					
				dataAnalysisService.indicatorConsistency(ccCallback, indicator, self.yearSelected.id, refYears, self.userOrgunit.id, self.orgunitLevelSelected.level);
			}
			
			//6 Indicator consistency chart
			var indicatorUIDs = [];
			for (var i = 0; i < indicatorIDs.length; i++) {
				indicatorUIDs.push(indicatorFromCode(indicatorIDs[i]).localData.id);
			}
			
			chartOptions = {};
			chartOptions.title = 'Consistency trend';
			chartOptions.showLegend = true;
			visualisationService.autoLineChart('consistencyMain', pe, indicatorUIDs, self.userOrgunit.id, chartOptions);
			
			//7 Indicator relations
			var relations = applicableRelations();
			var irCallback = function (result) {
				result.chartOptions = JSON.parse(JSON.stringify(self.chartConfigurations.consistencySmall));
				result.chartData = makeDataPoints(result.datapoints, result.boundaryValue, result.criteria, chartOptions);
				
				result.chartOptions.chart.xAxis.axisLabel = indicatorFromCode(result.A).name;
				result.chartOptions.chart.yAxis.axisLabel = indicatorFromCode(result.B).name;
				
				self.consistency.relations.push(result);
			}
			for (var i = 0; i < relations.length; i++) {
				var relation = relations[i];
				var indicatorA = indicatorFromCode(relation.A);
				var indicatorB = indicatorFromCode(relation.B);
				dataAnalysisService.indicatorRelation(irCallback, relation, indicatorA, indicatorB, self.yearSelected.id, self.userOrgunit.id, self.orgunitLevelSelected.level);
			}
	  	}
	  	
	  	
	  	function precedingYears(year, numberOfYears) {
	  		
	  		var start = parseInt(year);
	  		var years = [];
	  		for (var i = 1; i <= numberOfYears; i++) {
	  			years.push(start-i);
	  		}
	  		
	  		return years.sort(function(a, b){return a-b});
	  	
	  	}
		
		
		function dataSetsForCompleteness() {
			
			var datasetIDs = {};
			var indicatorIDs = indicatorIDsForAnalysis();
			for (var i = 0; i < indicatorIDs.length; i++) {
			
				var indicator = indicatorFromCode(indicatorIDs[i]);				
				if (indicator.matched) datasetIDs[indicator.dataSetID] = true;
			}
			
			var dataset = [];
			for (key in datasetIDs) {
				dataset.push(datasetFromID(key));			
			}
			
			return dataset;
		}
		
		
		function indicatorIDsForAnalysis() {
			if (self.groupSelected.code === 'C') {
				return self.map.coreIndicators;
			}
			
			for (var i = 0; i < self.map.groups.length; i++) {
				if (self.map.groups[i].code === self.groupSelected.code) {
					return self.map.groups[i].members;
				}
			}
		
		}
		
		
		function indicatorFromCode(code) {
			for (var i = 0; i < self.map.data.length; i++) {
				if (self.map.data[i].code === code) return self.map.data[i];
			}
		}
		
		
		function datasetFromID(id) {
			
			for (var i = 0; i < self.map.dataSets.length; i++) {
				if (self.map.dataSets[i].id === id) return self.map.dataSets[i];
			}
		}
		
		
		function periodTypeFromDataSet(dataSetID) {
			for (var i = 0; i < self.map.dataSets.length; i++) {
				if (dataSetID === self.map.dataSets[i].id) return self.map.dataSets[i].periodType;
			}
		}
		
		
		function dataForOutliers() {
			
			var data, dataIDs = [];
			for (var i = 0; i < self.map.data.length; i++) {
				data = self.map.data[i];
				if (data.matched && ((self.core && indicatorIsCore(data.code)) || indicatorInGroup(data.code))) {
					
					dataIDs.push({
						'id': data.localData.id,
						'modStdDev': data.moderateOutlier,
						'extStdDev': data.extremeOutlier,
						'consistency': data.consistency,
						'periodType': periodTypeFromDataSet(data.dataSetID)
					});
					
					
				}
			}

			return dataIDs;
			
		}
	
		
		function localDataIDfromCode(code) {
			var data;
			for (var i = 0; i < self.map.data.length; i++) {
				data = self.map.data[i];
				if (data.matched && ((self.core && indicatorIsCore(data.code)) || indicatorInGroup(data.code)) && data.code === code) {
					return self.map.data[i].localData.id;
				}
			}
			
			return null;
		}
		
		//Returns true/false depending on whether indicator is in selected group
		function indicatorIsRelevant(code) {
			for (var i = 0; i < self.map.data.length; i++) {				
				if (self.map.data[i].code === code) return true
			}
			
			return false;
		}
		
		//Returns relations relevant for the selected group (i.e. both indicators are in the group)
		function applicableRelations() {
			
			var dataIDs = indicatorIDsForAnalysis(), relation, relations = [];
			for (var i = 0; i < self.map.relations.length; i++) {
				relation = self.map.relations[i];
				
				if (indicatorIsRelevant(relation.A) && indicatorIsRelevant(relation.B)) {
					relations.push(relation);
				}
			}
			return relations;	
		}
	    
	    self.relationName = function(typeCode) {
	    
	    	if (typeCode === 'eq') return "Equal";
	    	if (typeCode === 'aGTb') return "A > B";
	    	if (typeCode === 'do') return "Dropout";
	    	
	    }
	    	    
	    function makeDataPoints(datapoints, nationalRatio, consistency, chartOptions) {	    		    	
	    	var chartSeries = [];
	    	var chartSerie = {
	    		'key': "Districts",
	    		'values': []
	    	}
	    	
	    	for (var i = 0; i < datapoints.length; i++) {
	    		chartSerie.values.push({
	    			'x': datapoints[i].refValue,
	    			'y': datapoints[i].value
	    		});
	    	}

	    	chartSeries.push(chartSerie);
	    	chartSeries.push(
	    		{
	    			'key': "National",
	    			'color': '#ffff',
	    			'values': [{
	    			'x': 0,
	    			'y': 0,
	    			'size': 0
	    			}
	    			],
	    			'slope': nationalRatio/100,
	    			'intercept': 0.001
	    		},
	    		{
	    			'key': "High",
	    			'color': '#ff7f0e',
	    			'values': [{
	    			'x': 0,
	    			'y': 0,
	    			'size': 0
	    			}
	    			],
	    			'slope': (nationalRatio+consistency)/100,
	    			'intercept': 0.001
	    		},
	    		{
	    			'key': "Low",
	    			'color': '#ff7f0e',
	    			'values': [{
	    			'x': 0,
	    			'y': 0,
	    			'size': 0
	    			}
	    			],
	    			'slope': (nationalRatio-consistency)/100,
	    			'intercept': 0.001
	    		}
	    	);
	    	
	    	//Todo: update axis etc
	    	
	    	return chartSeries;
	    }
	    
	    self.chartConfigurations = {
	    	'completeness': {
			   	"chart": {
			        "type": "multiBarChart",
			        "height": 350,
			        "margin": {
			          "top": 20,
			          "right": 20,
			          "bottom": 40,
			          "left": 60
			        },
			        "clipEdge": true,
			        "staggerLabels": true,
			        "transitionDuration": 1,
			        "stacked": false,
			        "xAxis": {
			          "showMaxMin": false
			        },
			        "yAxis": {
			          "axisLabel": "% Completeness",
			          "axisLabelDistance": 20
			        },
			        "forceY": [0,100],
			        "showControls": false
			    }
	    	},
	    	'consistency': {
	    	   	"chart": {
	    	        "type": "multiBarChart",
	    	        "height": 350,
	    	        "margin": {
	    	          "top": 20,
	    	          "right": 20,
	    	          "bottom": 40,
	    	          "left": 80
	    	        },
	    	        "clipEdge": true,
	    	        "staggerLabels": true,
	    	        "transitionDuration": 1,
	    	        "stacked": false,
	    	        "xAxis": {
	    	          "showMaxMin": false
	    	        },
	    	        "yAxis": {
	    	          "axisLabelDistance": 20,
	    	          "tickFormat": d3.format('g')
	    	        },
	    	        "showControls": false
	    	    }
	    	},
	    	'consistencySmall': {
	    	   	"chart": {
	    	        "type": "scatterChart",
	    	        "height": 350,
	    	        "margin": {
	    	          "top": 25,
	    	          "right": 15,
	    	          "bottom": 100,
	    	          "left": 100
	    	        },
	    	        "scatter": {
	    	        	"onlyCircles": false
	    	        },
	    	        "clipEdge": false,
	    	        "staggerLabels": true,
	    	        "transitionDuration": 1,
	    	        "showDistX": true,
    	            "showDistY": true,
    	            "xAxis": {
    	                  "axisLabel": "Previous periods",
    	                  "axisLabelDistance": 30,
    	                  "tickFormat": d3.format('g'),
    	                  "showMaxMin": false
    	            },
    	            "yAxis": {
    	            	"axisLabel": "Current period",
    	                "axisLabelDistance": 30,
    	                "tickFormat": d3.format('g')
    	            }
	    	    }
	    	}
	    };
	    
	    self.testData = [
	    	{
		    	'key': "Districts",
		    	'values': [
		    		{
		    		'x': 1,
		    		'y': 3
		    		},
		    		{
		    		'x': 2,
		    		'y': 6
		    		},
		    		{
		    		'x': 3,
		    		'y': 7
		    		}
		    	]
	    	},
	    	{
	    		'key': "National",
	    		'values': [{
	    		'x': 0,
	    		'y': 0,
	    		'size': 0
	    		}
	    		],
	    		'slope': 1,
	    		'intercept': 0.001
	    	},
	    	{
	    		'key': "+30%",
	    		'values': [{
	    		'x': 0,
	    		'y': 0,
	    		'size': 0
	    		}
	    		],
	    		'slope': 1.3,
	    		'intercept': 0.001
	    	},
	    	{
	    		'key': "-30%",
	    		'values': [{
	    		'x': 0,
	    		'y': 0,
	    		'size': 0
	    		}
	    		],
	    		'slope': 0.7,
	    		'intercept': 0.001
	    	}
	    	
	    ];
	    
		return self;
	});
	
})();


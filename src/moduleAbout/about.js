/**
 © Copyright 2017 the World Health Organization (WHO).

 This software is distributed under the terms of the GNU General Public License version 3 (GPL Version 3),
 copied verbatim in the file “COPYING”.  In applying this license, WHO does not waive any of the privileges and
 immunities enjoyed by WHO under national or international law or submit to any national court jurisdiction.
 */


import { version } from "../../package.json";

angular.module("about", []);

/**Controller: Parameters*/
angular.module("about").controller("AboutController",
	[function() {

		var self = this;

		self.version = version;

		return self;

	}]);


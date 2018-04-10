sap.ui.define([
	"com/cpfl/layout/model/GroupSortState",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function() {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function(assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("LAYOUT_ID").length, 1, "The sorting by LAYOUT_ID returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("NAME").length, 1, "The sorting by NAME returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function(assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("LAYOUT_ID").length, 1, "The group by LAYOUT_ID returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});

	QUnit.test("Should set the sorting to LAYOUT_ID if the user groupes by LAYOUT_ID", function(assert) {
		// Act + Assert
		this.oGroupSortState.group("LAYOUT_ID");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "LAYOUT_ID", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by NAME and there was a grouping before", function(assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "LAYOUT_ID");

		this.oGroupSortState.sort("NAME");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});

define([
  '../accUtils',
  'knockout',
  'ojs/ojarraydataprovider',
  'text!../data/store_data.json',
  'ojs/ojresponsiveutils',
  'ojs/ojresponsiveknockoututils',
  'ojs/ojhtmlutils',
  'ojs/ojknockout-keyset',
  'ojs/ojselectsingle',
  'ojs/ojlabel',
  'ojs/ojchart',
  'ojs/ojlistview',
  'ojs/ojavatar'], (
    AccUtils,
    ko,
    ArrayDataProvider,
    storeData,
    ResponsiveUtils,
    ResponsiveKnockoutUtils,
    HtmlUtils,
    { ObservableKeySet }) => {
  class DashboardViewModel {
    // Observables for Activities
    selectedActivity = new ObservableKeySet();
    activitySelected = ko.observable(false);  // Controls display of Activity Items
    firstSelectedActivity = ko.observable();
    selectedActivityIds = ko.observable();

    // Observables for Activity Items
    itemSelected = ko.observable(false);
    selectedItem = ko.observable();
    firstSelectedItem = ko.observable();
    constructor() {

      this.activityDataProvider = new ArrayDataProvider(JSON.parse(storeData), { keyAttributes: "id", });

      let activitiesArray = JSON.parse(storeData);
      let itemsArray = activitiesArray[0].items;

      this.itemsDataProvider = new ArrayDataProvider(itemsArray, { keyAttributes: "id" });

      this.itemData = ko.observable('');
      this.itemData(activitiesArray[0].items[0]);

      this.pieSeriesValue = ko.observableArray([{}]);

      let pieSeries = [
        { name: "Quantity in Stock", items: [this.itemData().quantity_instock] },
        { name: "Quantity Shipped", items: [this.itemData().quantity_shipped] },
      ];
      this.pieSeriesValue(pieSeries);


    }


    selectedActivityChanged = (event) => {
      /**
       *  If no items are selected, then this property firstSelectedItem 
       *  will return an object with both key and data properties set to null.
      */
      let itemContext = event.detail.value.data;

      if (itemContext != null) {
        // If selection, populate and display list
        // Hide currently-selected activity item
        this.activitySelected(false);

        let itemsArray = itemContext.items;
        this.itemsDataProvider.data = itemsArray;
        // Set List View properties
        this.activitySelected(true);
        this.itemSelected(false);
        this.selectedItem();
        this.itemData();

      } else {
        // If deselection, hide list
        this.activitySelected(false);
        this.itemSelected(false);
      }
    };

    /**
    * Handle selection from Activity Items list
    */
    selectedItemChanged = (event) => {

      let isClicked = event.detail.value.data;

      if (isClicked != null) {

        // If selection, populate and display list
        this.itemData(event.detail.value.data);

        // Create variable and get attributes of the items list to set pie chart values
        let pieSeries = [
          { name: "Quantity in Stock", items: [this.itemData().quantity_instock] },
          { name: "Quantity Shipped", items: [this.itemData().quantity_shipped] }
        ];
        // Update the pie chart with the data
        this.pieSeriesValue(pieSeries);

        this.itemSelected(true);

      }
      else {
        // If deselection, hide list
        this.itemSelected(false);


      }
    }
  }


  return DashboardViewModel;

}
);

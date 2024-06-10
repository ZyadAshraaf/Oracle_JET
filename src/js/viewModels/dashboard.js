
define([
  'knockout',
  'ojs/ojknockout-keyset',
  'ojs/ojrestdataprovider',
  'ojs/ojdataprovider',
  'ojs/ojbutton',
  'ojs/ojdialog',
  'ojs/ojselectsingle',
  'ojs/ojlabel',
  'ojs/ojchart',
  'ojs/ojlistview',
  'ojs/ojavatar',
  'ojs/ojinputtext'], (
    ko,
    { ObservableKeySet },
    { RESTDataProvider },
    { TextFilter }) => {
  class DashboardViewModel {

    // Activity key attribute that you'll pass as a parameter when creating 
    // RESTDataProvider instance
    keyAttributes = "id";
    // REST endpoint that returns Activity data
    restServerURLActivities = "https://apex.oracle.com/pls/apex/oraclejet/lp/activities/";

    // Initialize activityKey to 3 to construct an initial REST call
    activityKey = 3;

    // Initialize placeholder RESTDataProvider for activity items
    itemsDataProvider = new RESTDataProvider({
      keyAttributes: "id",
      url: "",
      transforms: {
        fetchFirst: {
          request: null,
          response: () => {
            return { data: [] };
          },
        },
      },
    });
    // REST endpoint that returns activity item data
    restServerURLItems =
      "https://apex.oracle.com/pls/apex/oraclejet/lp/activities/" +
      this.activityKey +
      "/items/";


    // Observables for Activities
    selectedActivity = new ObservableKeySet();
    activitySelected = ko.observable(false);  // Controls display of Activity Items
    firstSelectedActivity = ko.observable();
    selectedActivityIds = ko.observable();

    // Observables for Activity Items
    itemSelected = ko.observable(false);
    selectedItem = ko.observable();
    firstSelectedItem = ko.observable();
    inputImageFile = "css/images/product_images/jet_logo_256.png";

    selectedRow = ko.observable();
    constructor() {
      this.activityDataProvider = new RESTDataProvider({
        keyAttributes: this.keyAttributes,
        url: this.restServerURLActivities,
        transforms: {
          fetchFirst: {
            request: async (options) => {
              const url = new URL(options.url);
              const { size, offset } = options.fetchParameters;
              url.searchParams.set("limit", String(size));
              url.searchParams.set("offset", String(offset));
              return new Request(url.href);
            },
            response: async ({ body }) => {
              const { items, totalSize, hasMore } = body;
              return { data: items, totalSize, hasMore };
            },
          },
        },
      });

      this.itemData = ko.observable('');
      this.pieSeriesValue = ko.observableArray([{}]);
      let pieSeries = [
        { name: "Quantity in Stock", items: [this.itemData().quantity_instock] },
        { name: "Quantity Shipped", items: [this.itemData().quantity_shipped] },
      ];
      this.pieSeriesValue(pieSeries);

      this.itemName = ko.observable(null);
      this.price = ko.observable(null);
      this.short_desc = ko.observable(null);
      this.quantity_instock = ko.observable(null);
      this.quantity_shipped = ko.observable(null);
      this.quantity = 0;

      this.inputItemID = ko.observable(null);
      this.inputItemName = ko.observable(null);
      this.inputPrice = ko.observable(null);
      this.inputShortDesc = ko.observable(null);
    }

    showCreateDialog = (event) => {
      document.getElementById("createDialog").open();
    }


    createItem = async (event) => {
      this.quantity = this.quantity_instock() + this.quantity_shipped();
      let row = {
        name: this.itemName(),
        short_desc: this.short_desc(),
        price: this.price(),
        quantity_instock: this.quantity_instock(),
        quantity_shipped: this.quantity_shipped(),
        quantity: this.quantity,
        activity_id: this.activityKey,
        image: this.inputImageFile
      }
      const request = new Request(this.restServerURLItems, {
        headers: new Headers({
          "Content-Type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify(row),
        method: "POST"
      });

      const response = await fetch(request);
      const addedRow = await response.json();

      const addedRowKey = addedRow[this.keyAttributes];
      const addedRowMetaData = { key: addedRowKey };
      this.itemsDataProvider.mutate({
        add: {
          data: [addedRow],
          keys: new Set([addedRowKey]),
          metadata: [addedRowMetaData]
        }
      });
      this.itemsDataProvider.refresh();
      document.getElementById("createDialog").close();

    }

    showEditDialog = (event) => {
      this.inputItemID(this.itemData().id);
      this.inputItemName(this.itemData().name);
      this.inputPrice(this.itemData().price);
      this.inputShortDesc(this.itemData().short_desc);
      document.getElementById("editDialog").open();
    }

    updateItemSubmit = async (event) => {
      const currentRow = this.selectedRow;
      if (currentRow != null) {
        const row = {
          itemId: this.itemData().id,
          name: this.inputItemName(),
          price: this.inputPrice(),
          short_desc: this.inputShortDesc()
        }
        const request = new Request(`${this.restServerURLItems}${this.itemData().id}`, {
          headers: new Headers({
            "Content-type": "application/json; charset=UTF-8"
          }),
          body: JSON.stringify(row),
          method: "PUT"
        });
        const respone = await fetch(request);
        const updatedRow = await respone.json();

        const updatedRowKey = this.itemData().id;
        const updatedRowMeteData = { key: updatedRowKey };
        this.itemsDataProvider.mutate({
          update: {
            data: [updatedRow],
            keys: new Set([updatedRowKey]),
            metadata: [updatedRowMeteData]
          }
        });
        this.itemsDataProvider.refresh();
      }
      document.getElementById("editDialog").close();

    }


    deleteItem = async (event) => {
      let really = confirm("Are you sure you want to delete this item?");
      if (really) {
        const deleteItemId = this.itemSelected().id;
        const request = new Request(`${this.restServerURLItems}${this.itemData().id}`, {
          method: "DELETE"
        });

        const response = await fetch(request);

        if (response.status === 200) {
          const deletedRowKey = deleteItemId;
          const deletedRowMeteData = { key: deletedRowKey };
          this.itemsDataProvider.mutate({
            delete: {
              data: [deleteItemId],
              keys: new Set([deletedRowKey]),
              metadata: [deletedRowMeteData]
            }
          });
          this.itemsDataProvider.refresh();
        }
      }

    }
    selectedActivityChanged = (event) => {


      /**
       *  If no items are selected then the firstSelectedItem property  returns an object
       *  with both key and data properties set to null.
       */
      let itemContext = event.detail.value.data;

      if (itemContext != null) {
        // If selection, populate and display list
        // Hide currently-selected activity item
        this.activitySelected(false);

        this.activityKey = event.detail.value.data.id;
        this.restServerURLItems =
          "https://apex.oracle.com/pls/apex/oraclejet/lp/activities/" +
          this.activityKey +
          "/items/";

        // Create the itemsDataProvider instance of RESTDataProvider
        this.itemsDataProvider = new RESTDataProvider({
          keyAttributes: this.keyAttributes,
          capabilities: {
            filter: {
              textFilter: true,
            },
          },
          url: this.restServerURLItems,
          textFilterAttributes: ["name"],
          transforms: {
            fetchFirst: {
              request: async (options) => {
                const url = new URL(options.url);
                const { size, offset } = options.fetchParameters;
                url.searchParams.set("limit", String(size));
                url.searchParams.set("offset", String(offset));
                const filterCriterion = options.fetchParameters
                  .filterCriterion;
                const { textFilterAttributes } = options.fetchOptions;
                if (
                  filterCriterion &&
                  filterCriterion.text &&
                  textFilterAttributes
                ) {
                  const { text } = filterCriterion;
                  textFilterAttributes.forEach((attribute) => {
                    url.searchParams.set(attribute, text);
                  });
                }
                return new Request(url.href);
              },
              response: async ({ body }) => {
                const { items, totalSize, hasMore } = body;
                return { data: items, totalSize, hasMore };
              },
            },
          },
        });

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

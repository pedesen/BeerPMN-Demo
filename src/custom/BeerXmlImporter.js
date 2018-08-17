//import Brauhaus from "brauhaus";
// import "brauhaus-beerxml";

export default class BeerXmlImporter {
  constructor(
    eventBus,
    canvas,
    modeling,
    elementRegistry,
    injector,
    elementFactory
  ) {
    this.modeling = modeling;
    this.canvas = canvas;
    this.elementRegistry = elementRegistry;
    this.autoPlace = injector.get("autoPlace", false);
    this.elementFactory = elementFactory;

    this.currentElement = null;
    this.recipe = null;
  }
}

BeerXmlImporter.prototype.import = function(beerXml) {
  var recipes = Brauhaus.Recipe.fromBeerXml(beerXml);

  // take the first recipe
  this.recipe = recipes[0];

  if (!this.recipe) {
    console.log("no recipes found");
    // stop import
    return;
  }

  console.log(this.recipe);

  var startEvent = this.modeling.createShape(
    { type: "bpmn:StartEvent" },
    { x: 175, y: 200 },
    this.canvas.getRootElement()
  );
  this.modeling.updateProperties(startEvent, {
    name: `Start brewing ${this.recipe.name} by ${this.recipe.author ||
      "unknown"}`
  });
  this.currentElement = startEvent;

  this.createMashSteps();
  this.currentElement = this.createUserTask("Lautering");
  this.createCookingProcess();
};

BeerXmlImporter.prototype.createEndEvent = function(label) {
  var endEvent = this.modeling.appendShape(this.currentElement, {
    type: "bpmn:EndEvent"
  });
  this.modeling.updateProperties(endEvent, { name: label });
  return endEvent;
};

BeerXmlImporter.prototype.createUserTask = function(label) {
  var shape = this.elementFactory.createShape({ type: "bpmn:UserTask" });
  this.autoPlace.append(this.currentElement, shape);

  if (label) {
    this.modeling.updateProperties(shape, { name: `${label}` });
  }

  return shape;
};

BeerXmlImporter.prototype.createTimerEvent = function(label) {
  var timerEvent = this.elementFactory.createShape({
    type: "bpmn:IntermediateCatchEvent",
    eventDefinitionType: "bpmn:TimerEventDefinition"
  });
  this.autoPlace.append(this.currentElement, timerEvent);

  if (label) {
    this.modeling.updateProperties(timerEvent, { name: `${label}` });
  }
  return timerEvent;
};

BeerXmlImporter.prototype.createMashSteps = function() {
  var mash = this.recipe.mash;

  if (mash !== undefined) {
    var mashSteps = mash && mash.steps;

    mashSteps.forEach((mashStep, index) => {
      var label;
      if (index === 0) {
        label = "Mash In";
      } else if (index === mashSteps.length - 1) {
        label = "Mash Out";
      }

      if (mashStep.temp !== undefined) {
        label = `${label} at ${mashStep.temp}°C`;
      }

      var userTask = this.createUserTask(label);
      this.currentElement = userTask;

      if (index === 0) {
        this.createFermentables();
      }

      if (mashStep.time !== undefined) {
        this.currentElement = this.createTimerEvent(
          `hold temperature for ${mashStep.time} minutes`
        );
      }
    });
  }
};

BeerXmlImporter.prototype.createParallelGateway = function(label) {
  return this.modeling.appendShape(this.currentElement, {
    type: "bpmn:ParallelGateway"
  });
};

/**
 * Creates user tasks for all existing malt types
 */
BeerXmlImporter.prototype.createFermentables = function() {
  var modeling = this.modeling;
  var canvas = this.canvas;

  this.currentElement = this.createParallelGateway();

  var fermentableTasks = [];
  this.recipe.fermentables.forEach(fermentable => {
    var weight = Math.round(fermentable.weight * 100) / 100;
    var label = `Add malt:\n ${weight}kg of ${fermentable.name}`;

    fermentableTasks.push(this.createUserTask(label));
  });

  this.currentElement = fermentableTasks.shift();

  var parallelGateway = this.createParallelGateway();

  fermentableTasks.forEach(function(fermentableTask) {
    modeling.connect(fermentableTask, parallelGateway);
  });

  this.currentElement = parallelGateway;
};

BeerXmlImporter.prototype.createCookingProcess = function() {
  this.currentElement = this.createUserTask("Start to boil wort");
  var splittingGateway = this.createParallelGateway();
  this.currentElement = splittingGateway;

  var hops = this.recipe.spices;
  var boilTime = this.recipe.boilTime || 60;

  var endEvent;
  var mergingGateway;

  hops.filter(hop => hop.use.toLowerCase() === "boil").forEach(hop => {
    var hopTime = hop.time && boilTime - hop.time;

    var timerEvent = this.createTimerEvent(`wait ${hopTime} minutes`);
    this.currentElement = timerEvent;

    var hopWeight = hop.weight * 1000;
    var hopTask = this.createUserTask(
      `Add hops: \n${hopWeight}g of ${hop.name}`
    );

    if (!endEvent) {
      this.currentElement = hopTask;
      mergingGateway = this.createParallelGateway();
      this.currentElement = mergingGateway;
      endEvent = this.createEndEvent("Brewing is finished");
      this.currentElement = splittingGateway;
    } else {
      this.modeling.connect(hopTask, mergingGateway);
    }
    this.currentElement = splittingGateway;
  });

  this.currentElement = splittingGateway;
  var timerEvent = this.createTimerEvent(`boil for ${boilTime} minutes`);
  this.modeling.connect(timerEvent, mergingGateway);
};

BeerXmlImporter.$inject = [
  "eventBus",
  "canvas",
  "modeling",
  "elementRegistry",
  "injector",
  "elementFactory"
];

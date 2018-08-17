var BeerXmlImporter = require("./custom").default;
var BpmnJS = require("bpmn-js/lib/Modeler").default;

var INITIAL_DIAGRAM =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
  'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
  'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
  'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
  'targetNamespace="http://bpmn.io/schema/bpmn" ' +
  'id="Definitions_{{ ID }}">' +
  '<bpmn:process id="Process_1" isExecutable="false" />' +
  '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
  '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />' +
  "</bpmndi:BPMNDiagram>" +
  "</bpmn:definitions>";

var modeler = new BpmnJS({
  container: "#canvas",
  additionalModules: [BeerXmlImporter]
});

window.__modeler = modeler;

var importBeerXML = function(xml) {
  modeler.importXML(INITIAL_DIAGRAM, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
      var beerXmlImporter = modeler.get("beerXmlImporter");
      beerXmlImporter.import(xml);
    }
  });
};

window.__importBeerXML = importBeerXML;

const PROJECT_NAME = "hexa";
const ATTRIBUTE_PREFIX = "x";

function getDocuHead() {
  let docuhead = document.querySelector(`head > ${PROJECT_NAME}`);
  if (!docuhead) {
    docuhead = document.createElement(PROJECT_NAME);
    document.head.appendChild(docuhead);
  }
  docuhead = (docuhead as HTMLElement)!;
  return docuhead;
}

function getAttributeName(name: string) {
  return `${ATTRIBUTE_PREFIX}-${name}`;
}

const docuhead = getDocuHead();

export { PROJECT_NAME, ATTRIBUTE_PREFIX, getAttributeName, docuhead };

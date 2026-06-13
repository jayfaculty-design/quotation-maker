export interface Hospital {
  id: string;
  name: string;
  address: string;
}

export const HOSPITALS: Hospital[] = [
  {
    id: "ugmc",
    name: "UNIVERSITY OF GHANA MEDICAL CENTRE LTD",
    address: "P. O. BOX LG 25, LEGON- ACCRA, GHANA",
  },
  {
    id: "garh",
    name: "GREATER ACCRA REGIONAL HOSPITAL",
    address: "CASTLE ROAD, RIDGE, ACCRA, GHANA",
  },
  {
    id: "kbth",
    name: "KORLE BU TEACHING HOSPITAL",
    address: "P. O. BOX 77, KORLE BU, ACCRA",
  },
  {
    id: "kath",
    name: "KOMFO ANOKYE TEACHING HOSPITAL",
    address: "BANTAMA, KUMASI, ASHANTI REGION, GHANA",
  },
  {
    id: "mil37",
    name: "37 MILITARY HOSPITAL",
    address: "LIBERATION ROAD, ACCRA, GHANA",
  },
  {
    id: "tth",
    name: "TAMALE TEACHING HOSPITAL",
    address: "TAMALE, NORTHERN REGION, GHANA",
  },
  {
    id: "ccth",
    name: "CAPE COAST TEACHING HOSPITAL",
    address: "CAPE COAST, CENTRAL REGION, GHANA",
  },
];

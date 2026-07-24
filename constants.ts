import { Activity } from './types';

export const ACTIVITIES_TEMPLATE: Omit<Activity, 'completed'>[] = [
  { id: 1, name: 'Configurazione IP di MGT' },
  { id: 5, name: 'Prenotazione Lista Materiali' },
  { id: 3, name: 'Documentazione Servizi in Command' },
  { id: 4, name: 'Progetto Chiuso' },
];

export const STANDARD_OPERATIONS = "";

export const TIPO_APPARATI: string[] = [
    "7090 2 CeM",
    "7090 5G (01)",
    "7090 8G",
    "7090 LO CeM",
    "7090 92G",
    "7090 100 CeM (01)",
    "7090 100 CeM (02)",
    "7090 240 G (01)",
    "7090 240 G (02)",
    "7090 5G (02)"
];

export const PORTA_APPARATO_CLIENTE_OPTIONS: string[] = [
    "P01",
    "P02",
    "SFP1",
    "SFP2"
];

export const INITIAL_SERVICE_TERMINATION_DATA: any = {
  "MI-S.Donato": {
    "IP RETELITX": {
      "NNI INFINERA": {
        idEnriCommand: "CAC 940367",
        apparatoTransport: "San Donato - SAN DONATO M/ABG-LO(01X) -",
        portaApparato: "XG 1.1.1",
        apparatoIpNni: "sw7750-edge4-mi2 5/2/5",
        posizioneApparato: "Sala AXE Rack L17"
      },
      "NNI RIBBON": {
        idEnriCommand: "CAC 940368",
        apparatoTransport: "San Donato - eci2232-10G p4",
        portaApparato: "",
        apparatoIpNni: "sw7750-edge4-mi2 3/1/5",
        posizioneApparato: "Sala AXE Rack L17"
      }
    }
  },
  "RM-T.Spaccata": {
    "IP RETELITX": {
      "NNI INFINERA": {
        idEnriCommand: "CAC 940337",
        apparatoTransport: "Roma BT Torrespaccata – ROMA/CCS LO(01X)",
        portaApparato: "XG 1.1.1",
        apparatoIpNni: "sw7750-edge2-sft 8/2/5",
        posizioneApparato: "Sala New POP (P.T.)-Fila I Rack 25"
      },
      "NNI RIBBON": {
        idEnriCommand: "CAC 940363",
        apparatoTransport: "Roma BT Torrespaccata – eci2230-10G p4",
        portaApparato: "",
        apparatoIpNni: "sw7750-edge1-sft 9/2/5",
        posizioneApparato: "Sala New POP (P.T.)-Fila I Rack 25"
      }
    }
  },
  "Bologna via Grandi": {
    "IP RETELITX": {
      "NNI RIBBON - In corso di attivazione": {
        idEnriCommand: "",
        apparatoTransport: "eci2239 MGE-10G-4",
        portaApparato: "",
        apparatoIpNni: "sw7750-edge1-bo2 4/2/1",
        posizioneApparato: ""
      }
    }
  },
  "MI-Caldera": {
    "IP IRIDEOS": {
      "NNI Infinera per Servizi/CRQ tipo IMPRESA - verso nuovo Backbone IP": {
        idEnriCommand: "CAC 938762",
        apparatoTransport: "MILANO/LDX 7090 100 Cem.01",
        portaApparato: "XG 2.5",
        apparatoIpNni: "pe-mi-cal-001 Te0/1/0/3",
        posizioneApparato: "SALA OTELLO OP.01 FILA OP.04"
      },
      "NNI Ribbon per Servizi/CRQ tipo IMPRESA - verso nuovo Backbone IP": {
        idEnriCommand: "i3294I0054",
        apparatoTransport: "eci801-TS1-p1",
        portaApparato: "",
        apparatoIpNni: "pe-mi-cal-002 Te0/1/0/3",
        posizioneApparato: "SALA OTELLO OP.01 FILA OP.04"
      },
      "NNI Ribbon 2x10G Milano verso apparati IP ex MCLINK": {
        idEnriCommand: "",
        apparatoTransport: "eci801-TS16-p4 + TS18-p4",
        portaApparato: "",
        apparatoIpNni: "swme1-avaloncaldera-mi Po1 (Te0/0/14 + Te0/0/15)",
        posizioneApparato: ""
      }
    },
    "IP RDS": {
      "NNI Ribbon CALDERA verso rete Huawei IP": {
        idEnriCommand: "54773",
        apparatoTransport: "Eci810-TS5-porta 1",
        portaApparato: "",
        apparatoIpNni: "MICAN-C6X8-01 XG 5/0/4",
        posizioneApparato: ""
      },
      "NNI Infinera CALDERA verso rete Huawei IP": {
        idEnriCommand: "54774",
        apparatoTransport: "MILANO/LDX-100CEM.02",
        portaApparato: "XG 1.5",
        apparatoIpNni: "MICAN-C6X8-02 XG 5/0/10",
        posizioneApparato: "SALA OTELLO OP.01 FILA OP.04"
      }
    },
    "IP MAVIANMAX": {
      "CONSEGNA DIRETTA": {
        idEnriCommand: "NNIMVXIRD-02",
        apparatoTransport: "eci801-TS23-p12",
        portaApparato: "",
        apparatoIpNni: "",
        posizioneApparato: ""
      }
    }
  },
  "Cornelia": {
    "IP IRIDEOS": {
      "NNI Infinera per Servizi/CRQ tipo IMPRESA - verso nuovo Backbone IP": {
        idEnriCommand: "CAC 938761",
        apparatoTransport: "ROMA/TDX 7090 100 Cem.01",
        portaApparato: "XG 2.6",
        apparatoIpNni: "pe-rm-cor-002 Te0/1/0/4",
        posizioneApparato: "Fila A Pos 6"
      },
      "NNI Ribbon per Servizi/CRQ tipo IMPRESA - verso nuovo Backbone IP": {
        idEnriCommand: "i3294I0057",
        apparatoTransport: "eci2110-CPS50-p4",
        portaApparato: "",
        apparatoIpNni: "pe-rm-cor-001 Te0/1/0/3",
        posizioneApparato: ""
      },
      "NNI Infinera ex Cloud (1)": {
        idEnriCommand: "CAC 931310",
        apparatoTransport: "RM/TDX-240G.01",
        portaApparato: "XG 10.2",
        apparatoIpNni: "asr920-01-rm - Te0/0/25",
        posizioneApparato: "Fila A Pos 15"
      },
      "NNI Infinera ex Cloud (2)": {
        idEnriCommand: "CAC 931177",
        apparatoTransport: "RM/TDX-240G.01",
        portaApparato: "XG 6.2",
        apparatoIpNni: "asr920-02-rm - Te0/0/25",
        posizioneApparato: "Fila A Pos 15"
      }
    }
  },
  "Milano Bassi": {
    "IP IRIDEOS": {
      "NNI Infinera ex Cloud (1)": {
        idEnriCommand: "CAC 929722",
        apparatoTransport: "MILANO/TAE 240G.01",
        portaApparato: "XG 11.2",
        apparatoIpNni: "asr920-01-mi (pe-mi-asr920-01-mi)",
        posizioneApparato: ""
      },
      "NNI Infinera ex Cloud (2)": {
        idEnriCommand: "CAC 934072",
        apparatoTransport: "MILANO/TAE-240G.02",
        portaApparato: "XG 11.2",
        apparatoIpNni: "asr920-02-mi",
        posizioneApparato: ""
      }
    }
  },
  "Roma Perrier": {
    "IP IRIDEOS": {
      "NNI Ribbon 2x10G Roma verso apparati IP ex MCLINK": {
        idEnriCommand: "",
        apparatoTransport: "eci534-XSA-p4 + XSB-p4",
        portaApparato: "",
        apparatoIpNni: "swbtseth1-perrier-rm Po1 (Te0/3/0 + Te0/3/1)",
        posizioneApparato: ""
      }
    }
  },
  "RM-Letteratura": {
    "IP RDS": {
      "NNI Ribbon LETTERATURA verso rete Huawei IP": {
        idEnriCommand: "57572",
        apparatoTransport: "Eci2182 porta 10G-4",
        portaApparato: "",
        apparatoIpNni: "RMLET-C6X8-03 porta 7/0/7",
        posizioneApparato: ""
      },
      "NNI Infinera LETTERATURA verso rete Huawei IP": {
        idEnriCommand: "57573",
        apparatoTransport: "ROMA/BKU-7090-LO",
        portaApparato: "XG 1.1.1",
        apparatoIpNni: "RMLET-C6X8-04 porta 7/0/10",
        posizioneApparato: ""
      }
    }
  },
  "Padova Navigazione": {
    "IP RDS": {
      "NNI Ribbon PDNAV verso rete Huawei IP": {
        idEnriCommand: "57749",
        apparatoTransport: "Eci2185-porta 3",
        portaApparato: "",
        apparatoIpNni: "?",
        posizioneApparato: ""
      }
    }
  },
  "Padova Svizzera/Navigazione": {
    "IP RDS": {
      "NNI Infinera tra PDNAV e Svizzera verso rete Huawei IP - DA ATTIVARE": {
        idEnriCommand: "da definire",
        apparatoTransport: "da definire",
        portaApparato: "",
        apparatoIpNni: "da definire",
        posizioneApparato: "da definire"
      }
    }
  }
};

export const DEFAULT_INFRASTRUCTURE_DATA: Record<string, Record<string, string[]>> = {
  "MI-Caldera": {
    
    "7090 100 CeM (01)": ["SALA OTELLO OP.01 FILA OP.04 RACK 12"],
    "7090 LO CeM": ["SALA OTELLO OP.01 FILA OP.04 RACK 13"]
  },
  "Cornelia": {
    "7090 240 G (01)": ["Fila A Pos 15"],
    "7090 100 CeM (01)": ["Fila A Pos 6"],
    "7090 LO CeM": ["Fila A Pos 8"]
  },
  "MI-S.Donato": {
    "7090 LO CeM": ["Sala AXE Rack L17"],
   
  },
  "RM-T.Spaccata": {
    "7090 LO CeM": ["Sala New POP (P.T.)-Fila I Rack 25"],
   
  },
  "Bologna via Grandi": {
    "7090 LO CeM": ["Rack A03"],
    "7090 5G (01)": ["Rack A03"]
  },
  "Milano Bassi": {
    "7090 240 G (01)": ["Fila B Pos 02"],
    
  },
  "Roma Perrier": {
    "7090 LO CeM": ["Fila C Pos 04"]
  },
  "RM-Letteratura": {
    "7090 LO CeM": ["Sala BKU Fila D Rack 02"]
  },
  "Padova Navigazione": {
    "7090 LO CeM": ["Fila E Pos 11"]
  },
  "Padova Svizzera/Navigazione": {
    "7090 LO CeM": ["Fila E Pos 12"]
  },
  "POP Vicenza - Vicenza/TAE": {
    "7090 92G": ["N/A"]
  },
  "TIM MILANO TURRO - Ingresso da Via Marco Aurelio, 24": {
    "7090 92G": ["Sala ULL FILA A Pos 18"]
  },
  "TIM MILANO CERTOSA - MILANO/TST": {
    "7090 LO CeM": ["SALA B FILA F POS 15"]
  },
  "TIM ROMA PRATI- ROMA/T3T": {
    "7090 92G": ["SALA ULL FILA A POS 8"]
  },
  "TIM ROMA COLONNA- Roma/TIT": {
    "7090 100 CeM (02)": ["SALA ULL FILA B POS 25/26",]
  },
  "TIM ROMA SAN LORENZO - ROMA/TET": {
    "7090 92G": ["SALA ULL -FILA A - POS 2", "Sala ULL Fila A Pos 2"]
  },
  "POP QUINTO DI TREVISO-Treviso/TAE- Via Brondi 16, Quinto di Treviso": {
    "7090 92G": ["N/A"]
  },
  "POP CAMPI BISENZIO": {
    "7090 92G": ["piano -1 stanza 14/A (Sala Housing ex Clouditalia)"]
  },
  "POP Torino Corso Svizzera -Torino/TBX": {
    "7090 92G": ["N/A"]
  },
  "POP MILANO BASSI-MILANO/TAE": {
    "7090 240 G (01)": ["Sala TX2 - fila E rack 4", "Sala TX2 - Fila E Rack 4"]
  },
  "TIM MILANO BICOCCA - MILANO/TJT": {
    "7090 LO CeM": ["SALA ULL FILA D POS 4"]
  },
  "TREZZANO SUL/TAT": {
    "7090 LO CeM": ["SALA V FILA A POSIZIONE 2"]
  },
  "POP ROMA BERGAMINI- ROMA/TEX-RMLB9": {
    "7090 100 CeM (01)": ["SALA RED", "N/A"]
  },
  "TIM TRIESTE S.MAURIZIO-TRIESTE/TAT -VIA MAIOLICA, 5 (TS)": {
    "7090 8G": ["SALA A- FILA E -POS 9"]
  },
  "TIM LEGNANO B -Legano/TAT - Via Garibaldi  snc": {
    "7090 92G": ["Sala ULL FILA A3-A4"]
  },
  "TIM NAPOLI VOMERO-NAPOLI/TGT - NA5158N7": {
    "7090 92G": ["SALA ULL FILA B POS 10"]
  },
  "TIM MILANO VOLTA - MILANO/TGT- via Stelvio,15": {
    "7090 92G": ["Sala ULL fila C POS 9"]
  },
  "TIM MILANO VOLTA - MILANO/TGT": {
    "7090 92G": ["Sala ULL fila C POS 9"]
  },
  "TIM FIRENZE Affrico - FIRENZE/THT": {
    "7090 92G": ["N/A"]
  },
  "T.I. PERO - PERO/TAT -Via Gramsci 7": {
    "7090 LO CeM": ["SALA A FILA C POS 1"]
  },
  "TIM TORINO CENTRO - TORINO/THT": {
    "7090 92G": ["Sala ULL FILA A POS 15"]
  },
  "TIM ROMA CINECITTA'- ROMA/T9T": {
    "7090 92G": ["FILA ZA POS 11"]
  },
  "TIM ROMA NOMENTANA - ROMA/TRT": {
    "7090 92G": ["FILA B POS. 4"]
  },
  "TIM ROMA TRASTEVERE-ROMA/T1T": {
    "7090 92G": ["SALA ULL -FILA A - POS. 5", "Sala ULL FILA A POS 5-6"]
  },
  "TIM ROMA ARDEATINA - ROMA/TKT": {
    "7090 92G": ["Sala ULL FILA B POS 9"]
  },
  "TIM ROMA EUR - ROMA/TXT": {
    "7090 92G": ["SALA ULL FILA C POS 12"]
  },
  "DC Roma Cornelia - ROMA/TDX": {
    "7090 100 CeM (01)": ["FILA A POS 6"]
  },
  "TIM PESCARA CENTRO - PESCARA/TCT": {
    "7090 92G": ["Sala A.F \"B\" - Fila C - Telaio 14 "]
  },
  "TIM GENOVA SAMPIERDARENA- GENOVA/TDT": {
    "7090 8G": ["Sala ULL fila A pos 8"]
  },
  "POP BRESCIA- BRESCIA/TAE": {
    "7090 92G": ["N/A"]
  },
  "TIM MILANO SEGRATE -SEGRATE/TAM": {
    "7090 LO CeM": ["SALA OLO FILA A POS 1"]
  },
  "TIM MILANO CENTRO- MILANO/TPT": {
    "7090 LO CeM": ["SALA L FILA C POS 12"]
  },
  "TIM MILANO VERCELLI -MILANO/TDT": {
    "7090 92G": ["SALA ULL FILA D POS 12"]
  },
  "TIM ROMA PARIOLI - ROMA/TST": {
    "7090 92G": ["SALA ULL FILA A POS 2"]
  },
  "TIM MILANO CAVOUR - MILANO/TKT": {
    "7090 92G": ["N/A"]
  },
  "TIM ROMA AURELIA-ROMA/TPT": {
    "7090 92G": ["Sala ULL-FILA E - POS 7-8", "SALA OLO-PIANO-1 FILA E MONT 3"]
  },
  "POP MODUGNO - MODUGNO/TAE": {
    "7090 92G": ["FILA A  POS 5"]
  },
  "VERONA MEUCCI - VERONA/TAI": {
    "7090 92G": ["FILA L POS 14"]
  },
  "DC POP PISA - PISA/TAE": {
    "7090 240 G (01)": ["N/A"]
  },
  "T.I. UDINE BALDASSERIA-UDINE/TAT": {
    "7090 92G": ["SALA C FILA I POS 7"]
  }
};

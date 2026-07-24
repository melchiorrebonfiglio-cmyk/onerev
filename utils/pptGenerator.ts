import PptxGenJS from 'pptxgenjs';
import { Project, Sito } from '../types';
import { STANDARD_OPERATIONS } from '../constants';

export const calculateNetworkIp = (deviceIp: string): string => {
  if (!deviceIp) return 'N/A';
  // Regex to ensure it's a valid IP-like format before processing
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/;
  const match = deviceIp.match(ipRegex);
  
  if (!match) return 'IP non valido';

  const parts = match[0].split('.');
  if (parts.length !== 4) return 'IP non valido';
  
  const lastOctet = parseInt(parts[3], 10);
  if (isNaN(lastOctet) || lastOctet < 1) return 'IP non valido';
  
  parts[3] = (lastOctet - 1).toString();
  return parts.join('.');
};

export const generatePpt = async (project: Project, setIsGenerating: (val: boolean) => void) => {
  setIsGenerating(true);
  try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // --- STYLES ---
      const BLUE_THEME_COLOR = '0072C6';
      const WHITE_COLOR = 'FFFFFF';
      const BLACK_COLOR = '000000';
      const GRAY_BORDER_COLOR = 'D9D9D9';
      
      const TITLE_STYLE: PptxGenJS.TextPropsOptions = { x: 0.5, y: 0.25, w: 9, h: 0.7, fontSize: 20, bold: true, color: BLUE_THEME_COLOR };
      const LOGO_STYLE: PptxGenJS.TextPropsOptions = { x: 8, y: 0.2, w: 1.5, h: 0.5, fontSize: 24, bold: true, color: BLUE_THEME_COLOR, align: 'right' };
      
      const BASE_TABLE_CELL_STYLE: PptxGenJS.TableCellProps = { border: { type: 'solid', pt: 1, color: GRAY_BORDER_COLOR }, valign: 'middle', align: 'left', fontSize: 10 };
      const TABLE_HEADER_STYLE: PptxGenJS.TableCellProps = { ...BASE_TABLE_CELL_STYLE, fill: { color: BLUE_THEME_COLOR }, color: WHITE_COLOR, bold: true };
      const TABLE_LABEL_STYLE: PptxGenJS.TableCellProps = { ...BASE_TABLE_CELL_STYLE, color: BLACK_COLOR, bold: true };
      const TABLE_VALUE_STYLE: PptxGenJS.TableCellProps = { ...BASE_TABLE_CELL_STYLE, color: BLACK_COLOR, bold: false };
      
      const compilationDate = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Determine customerSite
      const sites: Sito[] = [];
      if (project.sitoA) sites.push(project.sitoA);
      if (project.sitoZ) sites.push(project.sitoZ);
      
      // Look for site where tipologiaSito matches "COLOCATIONCUSTMERSITE" (case-insensitive and whitespace-stripped)
      let customerSite: Sito | null = null;
      const exactMatch = sites.find(s => {
        const typeClean = s.tipologiaSito?.toLowerCase().replace(/[^a-z0-9]/g, '');
        return typeClean === 'colocationcustmersite' || typeClean === 'colocationcustomersite';
      });
      if (exactMatch) {
        customerSite = exactMatch;
      } else {
        // Look for site where tipologiaSito includes 'colocation' or 'customer' or 'cliente'
        const partialMatch = sites.find(s => {
          const typeLower = s.tipologiaSito?.toLowerCase() || '';
          return typeLower.includes('colocation') || typeLower.includes('cust') || typeLower.includes('client');
        });
        if (partialMatch) customerSite = partialMatch;
      }

      // --- SLIDE 1: Dati Progetto ---
      const slide1 = pptx.addSlide();
      slide1.addText('RETELIT', LOGO_STYLE);
      
      // Retrieve clean values for ID Ordine and ID ODF
      const cleanVal = (val: string | undefined | null) => {
        if (!val) return null;
        const stripped = val.trim();
        if (stripped.toUpperCase() === 'N/A' || stripped === '') return null;
        return stripped;
      };
      const cleanIdOrdine = cleanVal(project.ordine?.idOrdine) || cleanVal(project.id);
      const cleanIdOdf = cleanVal(project.ordine?.idOdf);

      // Retrieve values from Colocation Customer Site with fallback to default project details
      const customerSiteIndirizzo = customerSite 
          ? `${customerSite.indirizzo || ''}, ${customerSite.citta || ''} ${customerSite.acronimo ? `(${customerSite.acronimo})` : ''}`.trim()
          : `${project.via || ''}, ${project.citta || ''}`.trim();

      const customerSiteReferente = customerSite 
          ? customerSite.riferimentoCliente || 'N/A' 
          : project.riferimentoSede?.referente || 'N/A';

      const customerSiteTelefono = customerSite 
          ? customerSite.telefono || 'N/A' 
          : project.riferimentoSede?.tel || 'N/A';

      const customerSiteEmail = customerSite?.email || 'N/A';
      
      const projectDetailsRows: PptxGenJS.TableRow[] = [
          [
              { text: 'Dati Progetto', options: { ...TABLE_HEADER_STYLE, align: 'left' } },
              { text: `ID Ordine: ${cleanIdOrdine || 'N/A'}`, options: { ...TABLE_HEADER_STYLE, align: 'left' } },
              { text: `Data: ${compilationDate}`, options: { ...TABLE_HEADER_STYLE, align: 'left' } },
          ],
          [
              { text: 'ID ODF', options: TABLE_LABEL_STYLE },
              { text: cleanIdOdf || 'N/A', options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Ragione Sociale', options: TABLE_LABEL_STYLE },
              { text: project.ragioneSociale || 'N/A', options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Indirizzo', options: TABLE_LABEL_STYLE },
              { text: customerSiteIndirizzo || 'N/A', options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Riepilogo', options: TABLE_LABEL_STYLE },
              { text: project.riepilogo || 'N/A', options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Referente Sede', options: TABLE_LABEL_STYLE },
              { text: customerSiteReferente, options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Telefono Referente', options: TABLE_LABEL_STYLE },
              { text: customerSiteTelefono, options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
          [
              { text: 'Email Referente', options: TABLE_LABEL_STYLE },
              { text: customerSiteEmail, options: { ...TABLE_VALUE_STYLE, colspan: 2 } },
          ],
           [
              { text: 'Responsabile del progetto', options: { ...TABLE_LABEL_STYLE, fill: { color: BLUE_THEME_COLOR }, color: WHITE_COLOR } },
              { text: project.responsabileProgetto || 'N/A', options: { ...TABLE_VALUE_STYLE, colspan: 2, fill: { color: BLUE_THEME_COLOR }, color: WHITE_COLOR, bold: true } },
          ],
      ];
      slide1.addTable(projectDetailsRows, { x: 0.5, y: 0.75, w: 9, colW: [3, 4, 2] });

      // --- SLIDE 2: Operazioni Necessarie & Lista Materiali ---
      const slide2 = pptx.addSlide();
      slide2.addText('RETELIT', LOGO_STYLE);
      slide2.addText('Operazioni Necessarie', TITLE_STYLE);
      
      const allSitiCliente: { nomeApparato: string; tipoApparato: string }[] = [];
      project.activities.forEach(act => {
          if (act.technicalData) {
              const nomeApp = customerSite?.acronimo || act.technicalData.nomeApparato || 'N/A';
              const tipoApp = act.technicalData.tipoApparato || 'N/A';
              allSitiCliente.push({
                  nomeApparato: nomeApp,
                  tipoApparato: tipoApp
              });
          }
      });

      if (allSitiCliente.length === 0) {
          allSitiCliente.push({
              nomeApparato: 'N/A',
              tipoApparato: 'N/A'
          });
      }

      const allSitiIntermedi: { centrale: string; apparato: string; porta: string; patchOttica: boolean; attivita: string }[] = [];
      project.activities.forEach(act => {
          if (act.technicalData) {
              const siti = act.technicalData.sitiIntermedi && act.technicalData.sitiIntermedi.length > 0
                  ? act.technicalData.sitiIntermedi
                  : [{
                      id: 'legacy',
                      centrale: act.technicalData.centraleDiAttestazioneFibra || '',
                      apparato: act.technicalData.apparatoAttestazioneFibra || '',
                      posizione: act.technicalData.posizioneApparatoInCentrale || '',
                      porta: act.technicalData.portaApparatoAttestazioneFibra || '',
                      attivita: '',
                      patchOttica: true
                  }];
              siti.forEach(s => {
                  if (s.centrale || s.apparato || s.porta || s.attivita) {
                      allSitiIntermedi.push({
                          centrale: s.centrale || 'N/A',
                          apparato: s.apparato || 'N/A',
                          porta: s.porta || 'N/A',
                          patchOttica: s.patchOttica !== false,
                          attivita: s.attivita || ''
                      });
                  }
              });
          }
      });

      if (allSitiIntermedi.length === 0) {
          allSitiIntermedi.push({
              centrale: 'N/A',
              apparato: 'N/A',
              porta: 'N/A',
              patchOttica: true,
              attivita: ''
          });
      }

      const operationsList: string[] = [];

      operationsList.push('ATTIVITÀ IN SEDE CLIENTE:');
      allSitiCliente.forEach((c, idx) => {
          if (allSitiCliente.length > 1) {
              operationsList.push(`- Apparato #${idx + 1}:`);
              operationsList.push(`  - Installazione in sede cliente dell'apparato:`);
              operationsList.push(`    - Nome apparato: ${c.nomeApparato}`);
              operationsList.push(`    - Tipo di apparato: ${c.tipoApparato}`);
          } else {
              operationsList.push(`- Installazione in sede cliente dell'apparato:`);
              operationsList.push(`  - Nome apparato: ${c.nomeApparato}`);
              operationsList.push(`  - Tipo di apparato: ${c.tipoApparato}`);
          }
      });

      operationsList.push('');
      operationsList.push('ATTIVITÀ NEL SITO INTERMEDIO:');

      allSitiIntermedi.forEach((s, idx) => {
          if (allSitiIntermedi.length > 1) {
              operationsList.push(`- Sito Intermedio #${idx + 1}:`);
              operationsList.push(`  - SITO INTERMEDIO: ${s.centrale || 'N/A'}`);
              operationsList.push(`  - Apparato: ${s.apparato || 'N/A'}`);
              operationsList.push(`  - Inserimento SFP: nella porta ${s.porta || 'N/A'}`);
              if (s.patchOttica) {
                  operationsList.push(`  - Patch tra la porta ${s.porta || 'N/A'} e cassetto ottico`);
              }
              if (s.attivita) {
                  operationsList.push(`  - Attività nel sito intermedio (note): ${s.attivita}`);
              }
              operationsList.push('');
          } else {
              operationsList.push(`- SITO INTERMEDIO: ${s.centrale || 'N/A'}`);
              operationsList.push(`- Apparato: ${s.apparato || 'N/A'}`);
              operationsList.push(`- Inserimento SFP: nella porta ${s.porta || 'N/A'}`);
              if (s.patchOttica) {
                  operationsList.push(`- Patch tra la porta ${s.porta || 'N/A'} e cassetto ottico`);
              }
              if (s.attivita) {
                  operationsList.push(`- Attività nel sito intermedio (note): ${s.attivita}`);
              }
          }
      });

      if (operationsList[operationsList.length - 1] === '') {
          operationsList.pop();
      }

      const operazioniText = operationsList.join('\n');

      const operazioniRows: PptxGenJS.TableRow[] = [
           [ { text: 'Operazioni da Fare a cura di SERVICE ACTIVATION', options: { ...TABLE_HEADER_STYLE, colspan: 2 } } ],
           [ { text: operazioniText, options: { ...TABLE_VALUE_STYLE, colspan: 2, align: 'left', valign: 'top' } } ]
      ];
      slide2.addTable(operazioniRows, { x: 0.5, y: 0.75, w: 9, colW: [0.5, 8.5], rowH: [0.4, 4.5] });
      
      const technicalActivities = project.activities.filter(a => a.technicalData);
      const activitiesToLoop = technicalActivities.length > 0 ? technicalActivities : [{ id: 0, name: '', completed: false, technicalData: undefined }];

      for (const [index, activity] of activitiesToLoop.entries()) {
          const techData = activity.technicalData;
          const deviceLabel = activitiesToLoop.length > 1 ? `\n- Apparato ${index + 1}` : '';

          // --- SLIDE 3: Configurazione Apparato & MGT ---
          const slide3 = pptx.addSlide();
          slide3.addText('RETELIT', LOGO_STYLE);
          slide3.addText(`Dati Tecnici di Configurazione Apparato & MGT${deviceLabel}`, TITLE_STYLE);
          
          const configRows: PptxGenJS.TableRow[] = [
              [
                  { text: 'Dato Tecnico', options: TABLE_HEADER_STYLE },
                  { text: 'Valore', options: TABLE_HEADER_STYLE },
              ],
              [
                  { text: 'Nome Apparato', options: TABLE_LABEL_STYLE },
                  { text: customerSite?.acronimo || techData?.nomeApparato || 'N/A', options: TABLE_VALUE_STYLE },
              ],
              [
                  { text: 'IP Rete (/30)', options: TABLE_LABEL_STYLE },
                  { text: techData?.ip ? calculateNetworkIp(techData.ip) : 'N/A', options: TABLE_VALUE_STYLE },
              ],
              [
                  { text: 'IP Apparato', options: TABLE_LABEL_STYLE },
                  { text: techData?.ip || 'N/A', options: TABLE_VALUE_STYLE },
              ],
              [
                  { text: 'IP Gateway', options: TABLE_LABEL_STYLE },
                  { text: techData?.ipGateway || 'N/A', options: TABLE_VALUE_STYLE },
              ],
          ];
          slide3.addTable(configRows, { x: 0.5, y: 1.1, w: 9, colW: [4.5, 4.5] });

          const mgtRows: PptxGenJS.TableRow[] = [
              [
                  { text: 'Dato Tecnico', options: TABLE_HEADER_STYLE },
                  { text: 'Circuito di Managment', options: TABLE_HEADER_STYLE },
              ],
              [
                  { text: 'Terminazione Circuito di MGT', options: TABLE_LABEL_STYLE },
                  { text: techData?.centraleDiAttestazioneMgt || 'N/A', options: TABLE_VALUE_STYLE },
              ],
              [
                  { text: 'SVLAN MGT', options: TABLE_LABEL_STYLE },
                  { text: techData?.svlanMgt || 'N/A', options: TABLE_VALUE_STYLE },
              ],
          ];
          slide3.addTable(mgtRows, { x: 0.5, y: 3.2, w: 9, colW: [4.5, 4.5] });
          
          // --- SLIDE 4: Dati Tecnici di Installazione ---
          const slide4 = pptx.addSlide();
          slide4.addText('RETELIT', LOGO_STYLE);
          slide4.addText(`Dati Tecnici di Installazione${deviceLabel}`, TITLE_STYLE);

          const fibraRows: PptxGenJS.TableRow[] = [];
          const siti = techData?.sitiIntermedi && techData.sitiIntermedi.length > 0
              ? techData.sitiIntermedi
              : [{
                  id: 'legacy',
                  centrale: techData?.centraleDiAttestazioneFibra || '',
                  apparato: techData?.apparatoAttestazioneFibra || '',
                  posizione: techData?.posizioneApparatoInCentrale || '',
                  porta: techData?.portaApparatoAttestazioneFibra || '',
                  attivita: ''
              }];

          siti.forEach((sito, idx) => {
              const headerText = siti.length > 1
                  ? `Sito Intermedio #${idx + 1}`
                  : 'POP di Attestazione Fibra - Sito Intermedio';
              fibraRows.push([ { text: headerText, options: { ...TABLE_HEADER_STYLE, colspan: 2 } } ]);
              fibraRows.push([ { text: 'Centrale Attestazione Fibra', options: TABLE_LABEL_STYLE }, { text: sito.centrale || 'N/A', options: TABLE_VALUE_STYLE } ]);
              fibraRows.push([ { text: 'Apparato Attestazione Fibra', options: TABLE_LABEL_STYLE }, { text: sito.apparato || 'N/A', options: TABLE_VALUE_STYLE } ]);
              fibraRows.push([ { text: 'Posizione Apparato in Centrale', options: TABLE_LABEL_STYLE }, { text: sito.posizione || 'N/A', options: TABLE_VALUE_STYLE } ]);
              fibraRows.push([ { text: 'Porta Apparato Attestazione Fibra', options: TABLE_LABEL_STYLE }, { text: sito.porta || 'N/A', options: TABLE_VALUE_STYLE } ]);
              if (sito.attivita) {
                  fibraRows.push([ { text: 'Attività nel sito intermedio', options: TABLE_LABEL_STYLE }, { text: sito.attivita, options: TABLE_VALUE_STYLE } ]);
              }
          });
          slide4.addTable(fibraRows, { x: 0.5, y: 1.1, w: 9, colW: [4.5, 4.5] });

          // --- SLIDE 5: Dati Tecnici di Configurazione del Servizio ---
          const slide5 = pptx.addSlide();
          slide5.addText('RETELIT', LOGO_STYLE);
          slide5.addText(`Dati Tecnici di Configurazione del Servizio${deviceLabel}`, TITLE_STYLE);

          const servizioRows: PptxGenJS.TableRow[] = [
              [ { text: 'POP di Terminazione del Servizio', options: { ...TABLE_HEADER_STYLE, colspan: 3 } } ],
              [ { text: 'Lato Rete', options: { ...TABLE_LABEL_STYLE, rowspan: 9, valign: 'top' } }, { text: 'Centrale Terminazione Servizio', options: TABLE_LABEL_STYLE }, { text: techData?.terminazioneDelServizio || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Tipo di Consegna', options: TABLE_LABEL_STYLE }, { text: techData?.tipoConsegna || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Rete di Consegna', options: TABLE_LABEL_STYLE }, { text: techData?.reteConsegna || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Apparato Transport', options: TABLE_LABEL_STYLE }, { text: techData?.apparatoTransportAttestazioneServizio || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Porta Apparato', options: TABLE_LABEL_STYLE }, { text: techData?.portaApparatoAttestazioneServizio || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Apparato IP (NNI)', options: TABLE_LABEL_STYLE }, { text: techData?.apparatoIpNni || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'ID (ENRI/Command)', options: TABLE_LABEL_STYLE }, { text: techData?.idEnriCommand || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Posizione Apparato', options: TABLE_LABEL_STYLE }, { text: techData?.posizioneApparato || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'SVLAN PAY', options: TABLE_LABEL_STYLE }, { text: techData?.svlanPay || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Lato Cliente', options: { ...TABLE_LABEL_STYLE, rowspan: 2, valign: 'top' } }, { text: 'Nome Apparato', options: TABLE_LABEL_STYLE }, { text: techData?.nomeApparato || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Porta Apparato Cliente', options: TABLE_LABEL_STYLE }, { text: techData?.portaApparatoCliente || 'N/A', options: TABLE_VALUE_STYLE } ],
          ];
          slide5.addTable(servizioRows, { x: 0.5, y: 1.1, w: 9, colW: [2, 3.5, 3.5] });

          // Retrieve ID Command and Naming Del Servizio from activity 3 (Documentazione Servizi in Command)
          const docServiziActivity = project.activities.find(a => (a.originalId ?? a.id) === 3);
          const idCommandVal = docServiziActivity?.idCommand || 'N/A';
          const namingServizioVal = docServiziActivity?.namingServizio || 'N/A';

          // --- SLIDE 5b: Dati Documentazione Command (Nuova Slide) ---
          const slide5_new = pptx.addSlide();
          slide5_new.addText('RETELIT', LOGO_STYLE);
          slide5_new.addText(`Dati Documentazione Command${deviceLabel}`, TITLE_STYLE);

          const docCommandRows: PptxGenJS.TableRow[] = [
              [ { text: 'Dati Documentazione Command', options: { ...TABLE_HEADER_STYLE, colspan: 2 } } ],
              [ { text: 'ID Command', options: TABLE_LABEL_STYLE }, { text: idCommandVal, options: TABLE_VALUE_STYLE } ],
              [ { text: 'Naming Del Servizio', options: TABLE_LABEL_STYLE }, { text: namingServizioVal, options: TABLE_VALUE_STYLE } ],
              [ { text: 'SVLAN PAY', options: TABLE_LABEL_STYLE }, { text: techData?.svlanPay || 'N/A', options: TABLE_VALUE_STYLE } ],
          ];
          slide5_new.addTable(docCommandRows, { x: 0.5, y: 1.1, w: 9, colW: [4.5, 4.5] });

          // --- SLIDE 6: Schema del collegamento ---
          const slide6 = pptx.addSlide();
          slide6.addText('RETELIT', LOGO_STYLE);
          slide6.addText(`Schema del collegamento${deviceLabel}`, TITLE_STYLE);

          const opticalInfoRows: PptxGenJS.TableRow[] = [
              [ { text: 'Lunghezza Ottica', options: TABLE_LABEL_STYLE }, { text: techData?.lunghezzaOttica || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Attenuazione MAX (Db)', options: TABLE_LABEL_STYLE }, { text: techData?.attenuazioneMaxDb || 'N/A', options: TABLE_VALUE_STYLE } ],
          ];
          slide6.addTable(opticalInfoRows, { x: 3.25, y: 1.1, w: 3.5, colW: [2, 1.5] });
          
          const boxFillColor = 'DEEAF6'; // Light blue
          const boxStyle: PptxGenJS.ShapeProps = { x: 0.5, y: 2.5, w: 2.5, h: 1.5, fill: { color: boxFillColor }, line: { color: '000000', width: 1 } };
          slide6.addShape(pptx.ShapeType.rect, boxStyle);
          slide6.addText('APPARATO\nCLIENTE', { ...boxStyle, align: 'center', valign: 'middle', color: BLACK_COLOR, fontSize: 12, bold: true });

          const box2Style: PptxGenJS.ShapeProps = { ...boxStyle, x: 7.0 };
          slide6.addShape(pptx.ShapeType.rect, box2Style);
          slide6.addText('Apparato di\nCentrale', { ...box2Style, align: 'center', valign: 'middle', color: BLACK_COLOR, fontSize: 12, bold: true });
          
          slide6.addShape(pptx.ShapeType.line, { x: 3.0, y: 3.25, w: 4.0, h: 0, line: { color: '8FAADC', width: 2 } });

          const clientSchemaDetails: PptxGenJS.TableRow[] = [
              [ { text: 'Dettaglio Apparato Cliente', options: { ...TABLE_HEADER_STYLE, colspan: 2 } } ],
              [ { text: 'Porta', options: TABLE_LABEL_STYLE }, { text: 'SFP 1', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Fibra', options: TABLE_LABEL_STYLE }, { text: '', options: TABLE_VALUE_STYLE } ],
          ];
          slide6.addTable(clientSchemaDetails, { x: 0.5, y: 4.2, w: 2.5, colW: [1.25, 1.25], rowH: 0.3 });

          const centralSchemaDetails: PptxGenJS.TableRow[] = [
              [ { text: 'Dettaglio Apparato di Centrale', options: { ...TABLE_HEADER_STYLE, colspan: 2 } } ],
              [ { text: 'Apparato Attestazione Fibra', options: TABLE_LABEL_STYLE }, { text: techData?.apparatoAttestazioneFibra || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Porta Apparato Attestazione Fibra', options: TABLE_LABEL_STYLE }, { text: techData?.portaApparatoAttestazioneFibra || 'N/A', options: TABLE_VALUE_STYLE } ],
              [ { text: 'Posizione Cassetto Fibra', options: TABLE_LABEL_STYLE }, { text: techData?.posizioneCassettoFibra || 'N/A', options: TABLE_VALUE_STYLE } ],
          ];
          slide6.addTable(centralSchemaDetails, { x: 6.0, y: 4.2, w: 3.5, colW: [2.25, 1.25] });
          
          // --- SLIDE 7: Lista Materiali ---
          const slide7 = pptx.addSlide();
          slide7.addText('RETELIT', LOGO_STYLE);
          slide7.addText(`Lista Materiali${deviceLabel}`, TITLE_STYLE);

          const materialsActivity = project.activities.find(a => (a.originalId ?? a.id) === 5);
          
          if (materialsActivity) {
              // Add header/intestazione text at the bottom
              if (materialsActivity.materialsText) {
                  slide7.addText(materialsActivity.materialsText, {
                      x: 0.5,
                      y: 4.4,
                      w: 9.0,
                      h: 1.1,
                      fontSize: 8,
                      color: '475569',
                      valign: 'top',
                      align: 'left',
                      fontFace: 'Courier New',
                      fill: { color: 'F8FAFC' }
                  });
              } else {
                  slide7.addText('Nessun dettaglio intestazione estratto', {
                      x: 0.5,
                      y: 4.4,
                      w: 9.0,
                      h: 1.1,
                      fontSize: 8,
                      color: '94A3B8',
                      align: 'center',
                      valign: 'middle',
                      fill: { color: 'F8FAFC' }
                  });
              }

              // Add materials table
              const materialsRows: PptxGenJS.TableRow[] = [
                  [
                      { text: 'Codice Materiale', options: TABLE_HEADER_STYLE },
                      { text: 'Descrizione', options: TABLE_HEADER_STYLE },
                      { text: 'Quantità', options: { ...TABLE_HEADER_STYLE, align: 'center' } },
                  ]
              ];

              if (materialsActivity.materialsTable && materialsActivity.materialsTable.length > 0) {
                  materialsActivity.materialsTable.forEach(item => {
                      materialsRows.push([
                          { text: item.codice || '-', options: TABLE_LABEL_STYLE },
                          { text: item.descrizione || '-', options: TABLE_VALUE_STYLE },
                          { text: item.quantita || '1', options: { ...TABLE_VALUE_STYLE, align: 'center', bold: true } },
                      ]);
                  });
              } else {
                  materialsRows.push([
                      { text: 'Nessun articolo estratto o inserito riga', options: { ...TABLE_VALUE_STYLE, colspan: 3, align: 'center' } }
                  ]);
              }

              slide7.addTable(materialsRows, { x: 0.5, y: 1.1, w: 9.0, colW: [2.5, 5.5, 1.0] });

              // --- SLIDE 8: Lista Materiali Prenotata (Nuova Slide) ---
              const slide8 = pptx.addSlide();
              slide8.addText('RETELIT', LOGO_STYLE);
              slide8.addText(`Lista Materiali Prenotata${deviceLabel}`, TITLE_STYLE);

              if (materialsActivity.materialsImage) {
                  slide8.addImage({
                      data: materialsActivity.materialsImage,
                      x: 0.5,
                      y: 1.1,
                      w: 9.0,
                      h: 4.1
                  });
              } else {
                  slide8.addText('Nessuna immagine di prenotazione caricata', {
                      x: 0.5,
                      y: 1.1,
                      w: 9.0,
                      h: 4.1,
                      fontSize: 14,
                      color: '94A3B8',
                      align: 'center',
                      valign: 'middle',
                      fill: { color: 'F8FAFC' }
                  });
              }
          } else {
              slide7.addText('Attività "Prenotazione Lista Materiali" non trovata.', {
                  x: 0.5,
                  y: 1.1,
                  w: 9.0,
                  h: 4.5,
                  fontSize: 14,
                  color: 'EF4444',
                  align: 'center',
                  valign: 'middle'
              });
          }
      }

      await pptx.writeFile({ fileName: `Progetto_${project.id}.pptx` });

  } catch (error) {
      console.error("Errore durante la generazione del PPT:", error);
      alert("Errore durante la generazione del PPT:\n" + (error instanceof Error ? error.message : "Si è verificato un errore imprevisto."));
  } finally {
      setIsGenerating(false);
  }
};

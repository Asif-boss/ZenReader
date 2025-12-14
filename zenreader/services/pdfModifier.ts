import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Annotation } from '../types';

// Helper to convert hex color to RGB tuple (0-1)
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

export const savePDFWithAnnotations = async (file: File, annotations: Annotation[]): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  // Embed standard font for text annotations
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    // Annotations are 1-based index, pages array is 0-based
    if (ann.page > pages.length) continue;
    const page = pages[ann.page - 1];
    const { width, height } = page.getSize();
    const color = hexToRgb(ann.color);

    switch (ann.type) {
      case 'highlight':
      case 'underline':
      case 'strikethrough':
        // For highlights, we draw semi-transparent rectangles
        if ('rects' in ann) {
           for (const r of ann.rects) {
              // Convert % to points
              // x in PDF = (x% / 100) * width
              // y in PDF (bottom-up) = height - (y% + height%) * height/100
              const w = (r.width / 100) * width;
              const h = (r.height / 100) * height;
              const x = (r.x / 100) * width;
              // r.y is from top. PDF y is from bottom.
              // Top of rect in visual is r.y
              // Bottom of rect in visual is r.y + r.height
              // PDF y (bottom-left corner) corresponds to visual bottom
              const y = height - ((r.y + r.height) / 100) * height;

              if (ann.type === 'highlight') {
                 page.drawRectangle({
                    x,
                    y,
                    width: w,
                    height: h,
                    color: color,
                    opacity: 0.3,
                 });
              } else if (ann.type === 'underline') {
                 // Draw line at the bottom
                 page.drawLine({
                    start: { x, y },
                    end: { x: x + w, y },
                    color: color,
                    thickness: 2,
                 });
              } else if (ann.type === 'strikethrough') {
                 // Draw line in middle
                 const midY = y + h / 2;
                 page.drawLine({
                    start: { x, y: midY },
                    end: { x: x + w, y: midY },
                    color: color,
                    thickness: 2,
                 });
              }
           }
        }
        break;

      case 'text':
        if ('content' in ann) {
            const fontSize = ann.fontSize || 12;
            const x = (ann.x / 100) * width;
            // Text y in pdf-lib is baseline. Approximate top-left positioning
            const y = height - (ann.y / 100) * height - fontSize; 
            
            page.drawText(ann.content, {
                x,
                y,
                size: fontSize,
                font: font,
                color: color,
            });
        }
        break;

      case 'box':
      case 'circle':
        if ('width' in ann) {
             const w = (Math.abs(ann.width) / 100) * width;
             const h = (Math.abs(ann.height) / 100) * height;
             const x = (Math.min(ann.x, ann.x + ann.width) / 100) * width;
             // Y logic: visual y is top. PDF y is bottom.
             // Visual top y = ann.y. Visual height = ann.height.
             // Visual bottom y = ann.y + ann.height (if height > 0)
             // Let's normalize
             const rawY = Math.min(ann.y, ann.y + ann.height);
             const rawH = Math.abs(ann.height);
             const y = height - ((rawY + rawH) / 100) * height;

             if (ann.type === 'box') {
                 page.drawRectangle({
                     x,
                     y,
                     width: w,
                     height: h,
                     borderColor: color,
                     borderWidth: 2,
                     opacity: 0, // Transparent fill
                     borderOpacity: 1
                 });
             } else {
                 page.drawEllipse({
                     x: x + w/2,
                     y: y + h/2,
                     xScale: w/2,
                     yScale: h/2,
                     borderColor: color,
                     borderWidth: 2,
                     opacity: 0,
                     borderOpacity: 1
                 });
             }
        }
        break;
        
      case 'arrow':
        // Simplified arrow (just a line for now to ensure robustness)
        if ('width' in ann) {
            const x1 = (ann.x / 100) * width;
            const y1 = height - (ann.y / 100) * height;
            const x2 = ((ann.x + ann.width) / 100) * width;
            const y2 = height - ((ann.y + ann.height) / 100) * height;

            page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                color: color,
                thickness: 2,
            });
            // Arrowhead drawing would require more vector math, omitting for stability
        }
        break;

      case 'pen':
      case 'marker':
         if ('points' in ann && ann.points.length > 1) {
             const opacity = ann.opacity || 1;
             const thickness = (ann.type === 'marker' ? 10 : 2); // Approximate scale
             
             // Construct SVG path or draw multiple lines
             // Drawing lines is safer in pdf-lib than complex path handling without path parser
             for(let i = 0; i < ann.points.length - 1; i++) {
                 const p1 = ann.points[i];
                 const p2 = ann.points[i+1];
                 
                 page.drawLine({
                     start: { x: (p1.x / 100) * width, y: height - (p1.y / 100) * height },
                     end: { x: (p2.x / 100) * width, y: height - (p2.y / 100) * height },
                     thickness: thickness,
                     color: color,
                     opacity: opacity
                 });
             }
         }
         break;
         
       case 'note':
         // For sticky notes, we can add a standard annotation icon
         // or just draw a small square icon for visual representation
         if('x' in ann) {
             const size = 20;
             const x = (ann.x / 100) * width;
             const y = height - (ann.y / 100) * height - size;
             
             page.drawSquare({
                 x,
                 y,
                 size,
                 color: hexToRgb('#fbbf24'), // Yellow
             });
             // Note text content isn't easily visible unless we draw it, 
             // but standard sticky notes are hidden by default in PDF too.
             // We'll leave it as a marker.
         }
         break;
    }
  }

  return await pdfDoc.save();
};
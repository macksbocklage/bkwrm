import JSZip from 'jszip';

export interface ExtractedText {
  fullText: string;
  chapters: { title?: string; content: string }[];
}

/**
 * Extract text content from EPUB file
 */
export async function extractEpubText(fileUrl: string): Promise<ExtractedText> {
  try {
    // Fetch the EPUB file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch EPUB file');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse the EPUB as a ZIP file
    const zipFile = await JSZip.loadAsync(arrayBuffer);
    
    // Find the OPF file to get the reading order
    const opfPath = await findOpfPath(zipFile);
    if (!opfPath) {
      throw new Error('Could not find OPF file in EPUB');
    }
    
    // Read the OPF file to get content order
    const opfContent = await zipFile.files[opfPath].async('text');
    const contentPaths = extractContentPaths(opfContent, opfPath);
    
    // Extract text from each content file in order
    const chapters: { title?: string; content: string }[] = [];
    let fullText = '';
    
    for (const contentPath of contentPaths) {
      if (zipFile.files[contentPath]) {
        try {
          const htmlContent = await zipFile.files[contentPath].async('text');
          const textContent = stripHtmlTags(htmlContent);
          const title = extractChapterTitle(htmlContent);
          
          if (textContent.trim()) {
            chapters.push({ title, content: textContent });
            fullText += `\n\n${title ? `# ${title}\n` : ''}${textContent}`;
          }
        } catch (error) {
          console.warn(`Failed to extract text from ${contentPath}:`, error);
        }
      }
    }
    
    return { fullText: fullText.trim(), chapters };
    
  } catch (error) {
    console.error('Error extracting EPUB text:', error);
    throw new Error(`Failed to extract text from EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find the OPF file path in the EPUB
 */
async function findOpfPath(zipFile: JSZip): Promise<string | null> {
  // First, try to find container.xml
  if (zipFile.files['META-INF/container.xml']) {
    const containerXml = await zipFile.files['META-INF/container.xml'].async('text');
    const opfMatch = containerXml.match(/full-path="([^"]*\.opf)"/i);
    if (opfMatch) {
      return opfMatch[1];
    }
  }
  
  // If no container.xml or no OPF found, look for common OPF locations
  const possiblePaths = [
    'OEBPS/content.opf',
    'OEBPS/package.opf',
    'content.opf',
    'package.opf',
    'book.opf'
  ];
  
  for (const path of possiblePaths) {
    if (zipFile.files[path]) {
      return path;
    }
  }
  
  return null;
}

/**
 * Extract content file paths from OPF file in reading order
 */
function extractContentPaths(opfContent: string, opfPath: string): string[] {
  const contentPaths: string[] = [];
  const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
  
  try {
    // Extract spine order
    const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
    if (spineMatch) {
      const spineContent = spineMatch[1];
      const itemrefMatches = spineContent.match(/<itemref[^>]+idref="([^"]+)"/gi) || [];
      
      // Build manifest map
      const manifestMap: Record<string, string> = {};
      const manifestMatch = opfContent.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i);
      if (manifestMatch) {
        const manifestContent = manifestMatch[1];
        const itemMatches = manifestContent.match(/<item[^>]+/gi) || [];
        
        itemMatches.forEach(item => {
          const idMatch = item.match(/id="([^"]+)"/i);
          const hrefMatch = item.match(/href="([^"]+)"/i);
          if (idMatch && hrefMatch) {
            manifestMap[idMatch[1]] = basePath + hrefMatch[1];
          }
        });
      }
      
      // Get content paths in spine order
      itemrefMatches.forEach(itemref => {
        const idMatch = itemref.match(/idref="([^"]+)"/i);
        if (idMatch && manifestMap[idMatch[1]]) {
          contentPaths.push(manifestMap[idMatch[1]]);
        }
      });
    }
  } catch (error) {
    console.warn('Error parsing OPF spine:', error);
  }
  
  // If no spine found, try to find HTML/XHTML files directly
  if (contentPaths.length === 0) {
    const manifestMatch = opfContent.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i);
    if (manifestMatch) {
      const manifestContent = manifestMatch[1];
      const htmlMatches = manifestContent.match(/<item[^>]+href="([^"]*\.x?html?)"[^>]*>/gi) || [];
      
      htmlMatches.forEach(item => {
        const hrefMatch = item.match(/href="([^"]+)"/i);
        if (hrefMatch) {
          contentPaths.push(basePath + hrefMatch[1]);
        }
      });
    }
  }
  
  return contentPaths;
}

/**
 * Strip HTML tags and extract plain text
 */
function stripHtmlTags(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Replace common HTML elements with appropriate text
  text = text.replace(/<br[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines to double
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  text = text.trim();
  
  return text;
}

/**
 * Extract chapter title from HTML content
 */
function extractChapterTitle(html: string): string | undefined {
  // Try to find title in h1, h2, or title elements
  const titleMatch = html.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i) || 
                    html.match(/<title[^>]*>(.*?)<\/title>/i);
  
  if (titleMatch) {
    return stripHtmlTags(titleMatch[1]).trim();
  }
  
  return undefined;
}
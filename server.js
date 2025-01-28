// ----------------------------
// Import Required Modules
// ----------------------------
const express = require('express');
const { Cluster } = require('puppeteer-cluster'); // For parallel browser processing
const { PDFDocument } = require('pdf-lib');       // PDF generation library
const fs = require('fs');
const path = require('path');
const cors = require('cors');                     // Cross-Origin Resource Sharing
const bodyParser = require('body-parser');        // JSON request body parsing

// ----------------------------
// Initialize Express App
// ----------------------------
const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000

// ----------------------------
// Configuration
// ----------------------------
app.use(cors()); // Enable CORS for cross-domain requests
app.use(express.static('public')); // Serve static files from public directory
app.use(bodyParser.json()); // Parse JSON request bodies

// ----------------------------
// Route Handlers
// ----------------------------
// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------
// File System Configuration
// ----------------------------
// Create directories for temporary screenshots and final PDF reports
const screenshotsDir = path.join(__dirname, 'screenshots');
const reportsDir = path.join(__dirname, 'reports');

// Ensure required directories exist
[reportsDir, screenshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ----------------------------
// PDF Generation Endpoint
// ----------------------------
app.post('/generate-pdf', async (req, res) => {
  const { urls } = req.body;
  
  // Generate unique filename using ISO timestamp
  const isoString = new Date(Date.now()).toISOString();
  const pdfName = `report-${isoString}.pdf`;
  const pdfPath = path.join(reportsDir, pdfName);

  try {
    // ----------------------------
    // Browser Cluster Setup
    // ----------------------------
    // Launch headless browser cluster with 3 concurrent instances
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_BROWSER,
      maxConcurrency: 3,
      puppeteerOptions: { 
        headless: true,
      }
    });

    // ----------------------------
    // Screenshot Capture Process
    // ----------------------------
    const screenshotPaths = [];
    
    // Define browser cluster task for URL processing
    await cluster.task(async ({ page, data: url }) => {
      try {
        const filename = `screenshot-${Date.now()}.png`;
        const filepath = path.join(screenshotsDir, filename);
        
        // Configure page and navigation
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { 
          waitUntil: 'networkidle2', // Wait for network stability
          timeout: 30000 // 30-second timeout
        });
        
        // Capture full-page screenshot
        await page.screenshot({ 
          path: filepath, 
          fullPage: true
        });
        
        screenshotPaths.push(filepath);
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        throw error;
      }
    });

    // ----------------------------
    // Process URL Queue
    // ----------------------------
    // Add URLs to processing queue and wait for completion
    urls.forEach(url => cluster.queue(url));
    await cluster.idle();
    await cluster.close();

    // ----------------------------
    // PDF Assembly Process
    // ----------------------------
    const pdfDoc = await PDFDocument.create();
    
    // Add each screenshot as a separate PDF page
    for (const imagePath of screenshotPaths) {
      const imageBytes = fs.readFileSync(imagePath);
      const image = await pdfDoc.embedPng(imageBytes);
      
      // Create page matching screenshot dimensions
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    // Save final PDF to filesystem
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);

    // ----------------------------
    // Cleanup & Response
    // ----------------------------
    // Remove temporary screenshot files
    screenshotPaths.forEach(filePath => {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error cleaning up file:', filePath, err);
      }
    });

    // Send success response with download URL
    res.json({
      success: true,
      downloadUrl: `/reports/${pdfName}`
    });

  } catch (error) {
    // Error handling and logging
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'PDF generation failed',
      details: error.message 
    });
  }
});

// ----------------------------
// Serve Generated PDFs
// ----------------------------
app.use('/reports', express.static(reportsDir));

// ----------------------------
// Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
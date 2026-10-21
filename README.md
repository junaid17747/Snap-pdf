# SnapPDF — Image to PDF Converter & Compressor

**Convert multiple images into a single PDF, rearrange pages precisely, and optimize file size — all from your browser.**

SnapPDF is a mobile-friendly web application designed to make image-to-PDF conversion simple, flexible, and accessible. It lets users select multiple images, organize their page order, preview the resulting document, and generate a PDF with quality and compression settings.

The goal is to provide a convenient alternative to basic image-to-PDF converters, with a special focus on page management, mobile usability, and privacy.

## Features

### 🖼️ Multiple Image Selection
- Select multiple images in a single operation.
- Add more images without losing the existing page order.
- Preview selected images before generating the PDF.
- Remove unwanted images.
- Display filenames, image dimensions, and file sizes where available.
- Handle unsupported or corrupted files with helpful error messages.

### 🔀 Move to Page Number
SnapPDF's key feature is its explicit **Move to Page Number** functionality.

Instead of manually dragging images through a long list, users can specify the exact page where an image should appear.

For example, moving the image on page 5 to page 2 changes the order automatically:

**Before**

`A → B → C → D → E`

**After moving E to page 2**

`A → E → B → C → D`

The other images shift automatically, preserving every selected image without overwriting or duplicating pages.

### 📄 PDF Preview
- Preview the generated PDF before downloading it.
- Navigate between pages.
- Zoom in and out.
- Return to the editor to make changes.
- Regenerate the preview when the image order or PDF settings change.

### 📦 Smart PDF Compression
SnapPDF aims to balance file size and image quality with configurable compression presets.

- **High Quality:** Prioritizes image clarity.
- **Balanced:** Provides a practical balance between quality and file size.
- **Small File:** Prioritizes a smaller document, with a possible reduction in image detail.

Additional settings may include page size, image resolution, margins, and orientation.

Compression results depend on the source images, their dimensions, and the selected settings. SnapPDF does not guarantee a particular output size or percentage reduction.

### 📱 Mobile-Friendly Design
- Responsive interface for Android phones, tablets, and desktops.
- Touch-friendly controls.
- Mobile-friendly page management and PDF preview.
- Download and share options where supported by the browser.
- Progressive Web App (PWA) support when configured.

### 🔒 Privacy-Focused Processing
SnapPDF is designed to process images and generate PDFs locally in the browser.

The core conversion workflow does not require a backend server or a paid API. Images should not be uploaded to an external service as part of the conversion process.

## Supported Image Formats

The application is intended to support common image formats, including:

- JPEG / JPG
- PNG
- WebP
- BMP
- GIF
- AVIF

Support for HEIC / HEIF and other less common formats depends on the installed decoder and browser compatibility.

Animated GIFs may be converted using their first frame. Unsupported formats should produce a clear error rather than causing the application to fail.

**Note:** Actual format support depends on the implementation and should be verified against the formats documented in the running application.

## Technology Stack

The planned technology stack includes:

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety and maintainability |
| Vite | Development server and build tooling |
| Tailwind CSS | Responsive styling |
| pdf-lib | PDF creation and image embedding |
| PDF.js | PDF preview and rendering |
| Browser File API | Local file selection and handling |
| Web APIs | Image processing, downloads, and sharing |
| Service Worker | Offline application shell, if configured |

The final stack may differ depending on the implemented project.

## How It Works

1. **Select images:** Choose multiple images from your device.
2. **Organize pages:** Review the thumbnails, remove unwanted images, or move any image to a specified page number.
3. **Configure the PDF:** Select compression quality, page size, orientation, and margins.
4. **Preview:** Generate and inspect the PDF before exporting.
5. **Download:** Save the completed PDF to your device.

## Getting Started

### Prerequisites

Install the following on your computer:

- Node.js — a compatible current LTS release
- npm
- Git (optional, for version control)

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/SnapPDF.git
```

Navigate to the project folder:

```bash
cd SnapPDF
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5173
```

### Build for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

If configured, run the project's tests and type checks using the scripts defined in `package.json`.

## Using SnapPDF on Android

SnapPDF is designed to work in modern mobile browsers.

### Option 1: Run locally for testing

1. Start the development server on your computer.
2. Connect your Android phone and computer to the same Wi-Fi network.
3. Configure Vite to listen on the network interface, if necessary.
4. Open the computer's local network address and development port in Chrome on your phone.

For example:

```text
http://192.168.1.10:5173
```

Replace the example IP address with your computer's actual local network address.

This method is intended for development testing. Some browser features, particularly service workers and installation-related functionality, require a secure context.

### Option 2: Deploy and install as a PWA

1. Build the production version.
2. Deploy it to a hosting service that supports static websites.
3. Enable HTTPS.
4. Open the deployed website in Android Chrome.
5. Use Chrome's **Add to Home screen** or installation option if available.

PWA installation does not turn the website into a conventional native Android APK. The available installation and offline capabilities depend on the application's configuration and browser support.

## Project Structure

The application can be organized into reusable modules such as:

```text
SnapPDF/
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── ...
├── src/
│   ├── components/
│   │   ├── ImagePicker.tsx
│   │   ├── SelectedImageList.tsx
│   │   ├── PageCard.tsx
│   │   ├── MoveToPageDialog.tsx
│   │   ├── CompressionSettings.tsx
│   │   ├── PdfPreview.tsx
│   │   └── DownloadPanel.tsx
│   ├── utils/
│   │   ├── imageProcessor.ts
│   │   ├── pdfGenerator.ts
│   │   ├── pageReordering.ts
│   │   ├── fileValidation.ts
│   │   └── downloadUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

This is a suggested structure; update it to reflect the actual files in the repository.

## Performance Considerations

Large image collections can consume significant memory, especially on mobile devices.

SnapPDF should aim to:

- Generate thumbnails instead of rendering full-resolution images in every list item.
- Process images incrementally when practical.
- Avoid unnecessary image re-encoding.
- Release temporary object URLs and image resources when no longer needed.
- Display progress during PDF generation.
- Handle memory-related failures gracefully.
- Avoid claiming support for unlimited images.

Practical limits depend on image dimensions, device memory, browser capabilities, and PDF settings.

## Testing

Important test cases include:

- Converting multiple images into one PDF.
- Moving page 5 to page 2 and verifying the correct resulting order.
- Moving pages in the opposite direction.
- Rejecting invalid destination page numbers.
- Removing and adding images without corrupting the order.
- Previewing the correct document after reordering.
- Comparing PDF sizes across compression presets.
- Handling mixed image formats.
- Verifying that the generated PDF opens successfully.
- Testing the layout and file picker on an actual Android device.

Only mark tests as passing after they have actually been executed.

## Current Status

SnapPDF is a personal development project focused on image-to-PDF conversion, document organization, and browser-based compression.

Update this section as implementation progresses:

- [ ] Multiple image selection
- [ ] Image removal and addition
- [ ] Move to Page Number functionality
- [ ] PDF generation
- [ ] PDF preview
- [ ] Compression presets
- [ ] Page size and orientation settings
- [ ] File-size reporting
- [ ] Android browser testing
- [ ] PWA installation and offline support
- [ ] Automated tests

## Limitations

- Browser support for image formats varies.
- HEIC / HEIF files may require additional decoding support.
- Compression can reduce visual quality, especially at aggressive settings.
- Very large images and image collections may exceed mobile browser memory limits.
- The browser may open a system file picker rather than a dedicated Photos/Gallery interface.
- Output file size depends on the source images and export settings.
- A PWA is not equivalent to a fully native Android application.

## Future Improvements

Potential enhancements include:

- Improved HEIC / HEIF compatibility.
- Drag-and-drop page reordering.
- More advanced compression controls.
- Batch PDF creation.
- Page numbering and document metadata.
- Password-protected PDFs, if implemented securely.
- Additional page layouts and background options.
- Better support for very large image collections.
- Expanded automated and real-device testing.

## Contributing

This is a personal project, but suggestions, bug reports, and improvements are welcome.

When reporting a bug, include:

- Browser and operating system
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- Relevant error messages, if available

## License

Choose a license before distributing the project publicly.

For example, the MIT License permits broad reuse with attribution, subject to its terms. Add a `LICENSE` file if you choose MIT or another open-source license.

## Acknowledgements

SnapPDF is developed with the help of modern web technologies and AI-assisted development tools.

The project aims to demonstrate practical software engineering through document processing, responsive design, page-order management, compression, and client-side file handling.

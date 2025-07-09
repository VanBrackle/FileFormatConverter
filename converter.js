// Universal File Format Converter
class FileFormatConverter {
    constructor() {
        this.selectedFiles = [];
        this.selectedFormats = [];
        this.convertedFiles = [];
        this.isConverting = false;
        
        this.initializeEventListeners();
        this.initializeFormatButtons();
    }

    initializeEventListeners() {
        // File input handling
        const fileInput = document.getElementById('fileInput');
        const fileDropZone = document.getElementById('fileDropZone');
        const convertBtn = document.getElementById('convertBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        const clearResultsBtn = document.getElementById('clearResultsBtn');

        fileInput.addEventListener('change', (e) => this.handleFileSelection(e.target.files));
        
        // Drag and drop handling
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });

        fileDropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Convert button
        convertBtn.addEventListener('click', () => this.convertFiles());

        // Batch actions
        downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
        clearResultsBtn.addEventListener('click', () => this.clearResults());
    }

    initializeFormatButtons() {
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Prevent selection of disabled formats
                if (btn.disabled || btn.classList.contains('disabled')) {
                    return;
                }
                
                const format = btn.dataset.format;
                if (btn.classList.contains('selected')) {
                    btn.classList.remove('selected');
                    this.selectedFormats = this.selectedFormats.filter(f => f !== format);
                } else {
                    btn.classList.add('selected');
                    this.selectedFormats.push(format);
                }
                this.updateConvertButton();
            });
        });
    }

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.selectedFormats = []; // Clear previous selections
        this.updateAvailableFormats();
        this.updateConvertButton();
        this.showFilePreview();
    }

    showFilePreview() {
        const fileDropZone = document.getElementById('fileDropZone');
        if (this.selectedFiles.length > 0) {
            const fileNames = this.selectedFiles.map(f => f.name).join(', ');
            fileDropZone.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <h3>${this.selectedFiles.length} file(s) selected</h3>
                <p>${fileNames}</p>
                <button class="browse-btn" onclick="document.getElementById('fileInput').click()">
                    <i class="fas fa-folder-open"></i> Change Files
                </button>
            `;
        }
    }

    updateConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        const canConvert = this.selectedFiles.length > 0 && this.selectedFormats.length > 0;
        convertBtn.disabled = !canConvert;
    }

    updateAvailableFormats() {
        if (this.selectedFiles.length === 0) {
            this.showAllFormats();
            return;
        }

        // Get unique file types from selected files
        const fileTypes = [...new Set(this.selectedFiles.map(file => this.getFileType(file)))];
        
        // Define conversion compatibility matrix with input format considerations
        const conversionMatrix = {
            image: {
                png: ['jpg', 'webp', 'gif', 'bmp', 'ico', 'tiff'],
                jpg: ['png', 'webp', 'gif', 'bmp', 'ico', 'tiff'],
                jpeg: ['png', 'webp', 'gif', 'bmp', 'ico', 'tiff'],
                webp: ['png', 'jpg', 'gif', 'bmp', 'ico', 'tiff'],
                gif: ['png', 'jpg', 'webp', 'bmp', 'ico'],
                bmp: ['png', 'jpg', 'webp', 'gif', 'ico', 'tiff'],
                svg: ['png', 'jpg', 'webp', 'gif', 'bmp', 'ico'],
                ico: ['png', 'jpg', 'webp', 'gif', 'bmp'],
                tiff: ['png', 'jpg', 'webp', 'gif', 'bmp']
            },
            document: {
                txt: ['html', 'md', 'rtf', 'pdf'],
                html: ['txt', 'md', 'rtf', 'pdf'],
                htm: ['txt', 'md', 'rtf', 'pdf'],
                md: ['txt', 'html', 'rtf', 'pdf'],
                rtf: ['txt', 'html', 'md', 'pdf'],
                pdf: ['txt', 'html', 'md', 'rtf'],
                doc: ['txt', 'html', 'md', 'rtf', 'pdf'],
                docx: ['txt', 'html', 'md', 'rtf', 'pdf']
            },
            spreadsheet: {
                xls: ['xlsx', 'csv'],
                xlsx: ['csv'],
                csv: ['xlsx'],
                ods: ['xlsx', 'csv']
            },
            audio: {
                mp3: ['wav', 'ogg', 'aac'],
                wav: ['mp3', 'ogg', 'aac', 'flac'],
                ogg: ['mp3', 'wav', 'aac'],
                aac: ['mp3', 'wav', 'ogg'],
                flac: ['mp3', 'wav', 'ogg', 'aac']
            },
            video: {
                mp4: ['avi', 'mov', 'webm', 'mkv'],
                avi: ['mp4', 'mov', 'webm', 'mkv'],
                mov: ['mp4', 'avi', 'webm', 'mkv'],
                webm: ['mp4', 'avi', 'mov', 'mkv'],
                mkv: ['mp4', 'avi', 'mov', 'webm']
            },
            archive: {
                zip: ['rar', '7z', 'tar'],
                rar: ['zip', '7z', 'tar'],
                '7z': ['zip', 'rar', 'tar'],
                tar: ['zip', 'rar', '7z'],
                gz: ['zip', 'rar', '7z', 'tar']
            }
        };

        // Get all compatible formats based on input file types and extensions
        const compatibleFormats = new Set();
        
        this.selectedFiles.forEach(file => {
            const fileType = this.getFileType(file);
            const fileExtension = this.getFileExtension(file);
            
            if (conversionMatrix[fileType] && conversionMatrix[fileType][fileExtension]) {
                conversionMatrix[fileType][fileExtension].forEach(format => compatibleFormats.add(format));
            } else if (conversionMatrix[fileType]) {
                // Fallback: if specific extension not found, use all formats for that type
                Object.values(conversionMatrix[fileType]).flat().forEach(format => compatibleFormats.add(format));
            }
        });

        // Update format buttons visibility and state
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            const format = btn.dataset.format;
            const isCompatible = compatibleFormats.has(format);
            
            if (isCompatible) {
                btn.disabled = false;
                btn.classList.remove('disabled');
                btn.title = `Convert to ${format.toUpperCase()}`;
            } else {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.classList.remove('selected');
                btn.title = `Not compatible with selected file type(s)`;
            }
        });

        // Show file type info
        this.showFileTypeInfo(fileTypes);
    }

    showAllFormats() {
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
            btn.title = `Convert to ${btn.dataset.format.toUpperCase()}`;
        });

        // Hide file type info
        const fileTypeInfo = document.getElementById('fileTypeInfo');
        if (fileTypeInfo) {
            fileTypeInfo.style.display = 'none';
        }
    }

    showFileTypeInfo(fileTypes) {
        let fileTypeInfo = document.getElementById('fileTypeInfo');
        
        if (!fileTypeInfo) {
            fileTypeInfo = document.createElement('div');
            fileTypeInfo.id = 'fileTypeInfo';
            fileTypeInfo.className = 'file-type-info';
            
            // Insert after the file input area
            const fileInputArea = document.querySelector('.file-input-area');
            fileInputArea.parentNode.insertBefore(fileTypeInfo, fileInputArea.nextSibling);
        }

        const typeLabels = {
            image: 'Images',
            document: 'Documents',
            spreadsheet: 'Spreadsheets',
            audio: 'Audio',
            video: 'Video',
            archive: 'Archives',
            unknown: 'Unknown'
        };

        const validTypes = fileTypes.filter(type => type !== 'unknown');
        const unknownTypes = fileTypes.filter(type => type === 'unknown');

        let infoHTML = '<div class="file-type-summary">';
        
        if (validTypes.length > 0) {
            infoHTML += `<p><i class="fas fa-info-circle"></i> Selected files: ${validTypes.map(type => typeLabels[type]).join(', ')}</p>`;
        }
        
        if (unknownTypes.length > 0) {
            infoHTML += `<p class="warning"><i class="fas fa-exclamation-triangle"></i> Some files have unknown formats and may not be convertible</p>`;
        }

        infoHTML += '</div>';
        
        fileTypeInfo.innerHTML = infoHTML;
        fileTypeInfo.style.display = 'block';
    }

    async convertFiles() {
        if (this.isConverting) return;
        
        this.isConverting = true;
        this.showProgress();
        this.convertedFiles = [];

        const totalFiles = this.selectedFiles.length * this.selectedFormats.length;
        let completedFiles = 0;

        for (const file of this.selectedFiles) {
            for (const targetFormat of this.selectedFormats) {
                try {
                    const convertedFile = await this.convertFile(file, targetFormat);
                    if (convertedFile) {
                        this.convertedFiles.push(convertedFile);
                    }
                } catch (error) {
                    console.error(`Error converting ${file.name} to ${targetFormat}:`, error);
                }
                
                completedFiles++;
                this.updateProgress(completedFiles / totalFiles * 100);
            }
        }

        this.hideProgress();
        this.showResults();
        this.isConverting = false;
    }

    async convertFile(file, targetFormat) {
        const fileType = this.getFileType(file);
        const options = this.getConversionOptions();

        try {
            switch (fileType) {
                case 'image':
                    return await this.convertImage(file, targetFormat, options);
                case 'document':
                    return await this.convertDocument(file, targetFormat, options);
                case 'spreadsheet':
                    return await this.convertSpreadsheet(file, targetFormat, options);
                case 'audio':
                    return await this.convertAudio(file, targetFormat, options);
                case 'video':
                    return await this.convertVideo(file, targetFormat, options);
                case 'archive':
                    return await this.convertArchive(file, targetFormat, options);
                default:
                    throw new Error(`Unsupported file type: ${file.type}`);
            }
        } catch (error) {
            console.error(`Conversion failed for ${file.name} to ${targetFormat}:`, error);
            return null;
        }
    }

    getFileType(file) {
        const mimeType = file.type.toLowerCase();
        
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('pdf')) return 'document';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return 'archive';
        
        // Check file extension as fallback
        const extension = this.getFileExtension(file);
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'];
        const docExts = ['txt', 'html', 'htm', 'md', 'rtf', 'pdf', 'doc', 'docx'];
        const sheetExts = ['xls', 'xlsx', 'csv', 'ods'];
        const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
        const videoExts = ['mp4', 'avi', 'mov', 'webm', 'mkv'];
        const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];

        if (imageExts.includes(extension)) return 'image';
        if (docExts.includes(extension)) return 'document';
        if (sheetExts.includes(extension)) return 'spreadsheet';
        if (audioExts.includes(extension)) return 'audio';
        if (videoExts.includes(extension)) return 'video';
        if (archiveExts.includes(extension)) return 'archive';

        return 'unknown';
    }

    getFileExtension(file) {
        return file.name.split('.').pop().toLowerCase();
    }

    getConversionOptions() {
        return {
            quality: document.getElementById('quality').value,
            resize: document.getElementById('resize').value,
            compression: document.getElementById('compression').value
        };
    }

    async convertImage(file, targetFormat, options) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Apply resize if needed
                let { width, height } = img;
                if (options.resize !== 'none') {
                    const maxSize = this.getResizeDimensions(options.resize);
                    const ratio = Math.min(maxSize.width / width, maxSize.height / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Apply quality settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = options.quality === 'high' ? 'high' : 'medium';

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to target format
                let mimeType;
                let quality = 0.8;

                switch (targetFormat) {
                    case 'png':
                        mimeType = 'image/png';
                        quality = options.compression === 'lossless' ? 1.0 : 0.8;
                        break;
                    case 'jpg':
                        mimeType = 'image/jpeg';
                        quality = options.quality === 'high' ? 0.9 : options.quality === 'low' ? 0.6 : 0.8;
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        quality = options.quality === 'high' ? 0.9 : options.quality === 'low' ? 0.6 : 0.8;
                        break;
                    case 'gif':
                        mimeType = 'image/gif';
                        break;
                    case 'bmp':
                        mimeType = 'image/bmp';
                        break;
                    default:
                        reject(new Error(`Unsupported image format: ${targetFormat}`));
                        return;
                }

                canvas.toBlob((blob) => {
                    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat;
                    resolve({
                        name: fileName,
                        blob: blob,
                        size: blob.size,
                        type: mimeType,
                        originalFile: file.name
                    });
                }, mimeType, quality);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    async convertDocument(file, targetFormat, options) {
        const text = await file.text();
        let convertedContent;
        let mimeType;
        let fileName;

        switch (targetFormat) {
            case 'txt':
                convertedContent = text;
                mimeType = 'text/plain';
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.txt';
                break;
            case 'html':
                convertedContent = this.textToHtml(text);
                mimeType = 'text/html';
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.html';
                break;
            case 'md':
                convertedContent = this.textToMarkdown(text);
                mimeType = 'text/markdown';
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.md';
                break;
            case 'pdf':
                const pdfBlob = await this.textToPdf(text);
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
                return {
                    name: fileName,
                    blob: pdfBlob,
                    size: pdfBlob.size,
                    type: 'application/pdf',
                    originalFile: file.name
                };
            default:
                throw new Error(`Unsupported document format: ${targetFormat}`);
        }

        const blob = new Blob([convertedContent], { type: mimeType });
        return {
            name: fileName,
            blob: blob,
            size: blob.size,
            type: mimeType,
            originalFile: file.name
        };
    }

    async convertSpreadsheet(file, targetFormat, options) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let convertedContent;
        let mimeType;
        let fileName;

        switch (targetFormat) {
            case 'xlsx':
                const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                convertedContent = new Uint8Array(xlsxBuffer);
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.xlsx';
                break;
            case 'csv':
                const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                convertedContent = csvContent;
                mimeType = 'text/csv';
                fileName = file.name.replace(/\.[^/.]+$/, '') + '.csv';
                break;
            default:
                throw new Error(`Unsupported spreadsheet format: ${targetFormat}`);
        }

        const blob = new Blob([convertedContent], { type: mimeType });
        return {
            name: fileName,
            blob: blob,
            size: blob.size,
            type: mimeType,
            originalFile: file.name
        };
    }

    async convertAudio(file, targetFormat, options) {
        // Note: Audio conversion requires Web Audio API and is limited by browser capabilities
        // This is a simplified implementation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // For now, we'll return the original file with a note about limitations
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat;
        return {
            name: fileName,
            blob: file,
            size: file.size,
            type: file.type,
            originalFile: file.name,
            note: 'Audio conversion is limited by browser capabilities. Original file returned.'
        };
    }

    async convertVideo(file, targetFormat, options) {
        // Note: Video conversion is complex and typically requires server-side processing
        // This is a placeholder implementation
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat;
        return {
            name: fileName,
            blob: file,
            size: file.size,
            type: file.type,
            originalFile: file.name,
            note: 'Video conversion requires server-side processing. Original file returned.'
        };
    }

    async convertArchive(file, targetFormat, options) {
        // Note: Archive conversion is complex and typically requires server-side processing
        // This is a placeholder implementation
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat;
        return {
            name: fileName,
            blob: file,
            size: file.size,
            type: file.type,
            originalFile: file.name,
            note: 'Archive conversion requires server-side processing. Original file returned.'
        };
    }

    // Helper methods
    getResizeDimensions(resizeOption) {
        switch (resizeOption) {
            case '720p': return { width: 1280, height: 720 };
            case '1080p': return { width: 1920, height: 1080 };
            case '4k': return { width: 3840, height: 2160 };
            default: return { width: 1920, height: 1080 };
        }
    }

    textToHtml(text) {
        // Simple text to HTML conversion
        const lines = text.split('\n');
        const htmlLines = lines.map(line => {
            if (line.trim() === '') return '<br>';
            return `<p>${DOMPurify.sanitize(line)}</p>`;
        });
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Converted Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        p { margin: 0 0 10px 0; }
    </style>
</head>
<body>
    ${htmlLines.join('\n')}
</body>
</html>`;
    }

    textToMarkdown(text) {
        // Simple text to Markdown conversion
        const lines = text.split('\n');
        const mdLines = lines.map(line => {
            if (line.trim() === '') return '';
            if (line.startsWith('#') || line.startsWith('*') || line.startsWith('-')) return line;
            return line;
        });
        return mdLines.join('\n');
    }

    async textToPdf(text) {
        // Simple text to PDF conversion using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 595; // A4 width in points
        canvas.height = 842; // A4 height in points
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        
        const lines = text.split('\n');
        let y = 50;
        
        lines.forEach(line => {
            if (y > canvas.height - 50) return;
            ctx.fillText(line, 50, y);
            y += 20;
        });
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'application/pdf');
        });
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    }

    hideProgress() {
        document.getElementById('progressSection').style.display = 'none';
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = `Converting files... ${Math.round(percentage)}%`;
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');
        
        resultsGrid.innerHTML = '';
        
        this.convertedFiles.forEach(file => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item fade-in';
            
            const icon = this.getFileIcon(file.type);
            const size = this.formatFileSize(file.size);
            
            resultItem.innerHTML = `
                <i class="${icon}"></i>
                <h4>${file.name}</h4>
                <p>Size: ${size}</p>
                ${file.note ? `<p style="color: #ff6b6b; font-size: 0.8rem;">${file.note}</p>` : ''}
                <button class="download-btn" onclick="converter.downloadFile('${file.name}')">
                    <i class="fas fa-download"></i> Download
                </button>
            `;
            
            resultsGrid.appendChild(resultItem);
        });
        
        resultsSection.style.display = 'block';
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('pdf')) return 'fas fa-file-alt';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'fas fa-table';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return 'fas fa-archive';
        return 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadFile(fileName) {
        const file = this.convertedFiles.find(f => f.name === fileName);
        if (file) {
            saveAs(file.blob, file.name);
        }
    }

    downloadAllFiles() {
        if (this.convertedFiles.length === 1) {
            this.downloadFile(this.convertedFiles[0].name);
        } else {
            // Create a zip file for multiple files
            const zip = new JSZip();
            
            this.convertedFiles.forEach(file => {
                zip.file(file.name, file.blob);
            });
            
            zip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, 'converted_files.zip');
            });
        }
    }

    clearResults() {
        this.convertedFiles = [];
        document.getElementById('resultsSection').style.display = 'none';
        this.selectedFiles = [];
        this.selectedFormats = [];
        this.updateAvailableFormats();
        this.updateConvertButton();
        
        // Reset file drop zone
        const fileDropZone = document.getElementById('fileDropZone');
        fileDropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Drop files here or click to browse</h3>
            <p>Supports images, documents, audio, video, and more</p>
            <button class="browse-btn" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-folder-open"></i> Browse Files
            </button>
        `;
        
        // Clear format selections
        document.querySelectorAll('.format-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}

// Initialize the converter when the page loads
let converter;
document.addEventListener('DOMContentLoaded', () => {
    converter = new FileFormatConverter();
});

// Global function for download button
window.downloadFile = (fileName) => {
    if (converter) {
        converter.downloadFile(fileName);
    }
}; 
/**
 * Saves an exported file on the device, through the download of the browser.
 *
 * @class FileDownloader
 */
export class FileDownloader {
    /**
     * Starts the download of a file.
     * @param {{fileName: string, content: Blob}} file - Name and content of the file.
     */
    save(file) {
        const url = URL.createObjectURL(file.content);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        link.click();
        // Give the browser time to start the download before freeing the file.
        setTimeout(() => URL.revokeObjectURL(url));
    }
}

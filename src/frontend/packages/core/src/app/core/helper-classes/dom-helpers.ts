export function getScrollBarWidth() {
    // https://davidwalsh.name/detect-scrollbar-width
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scrollbar-measure';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
}

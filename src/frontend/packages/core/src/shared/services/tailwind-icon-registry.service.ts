import { Injectable, inject } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { type Observable, of } from 'rxjs';

export interface TailwindIconConfig {
  name: string;
  url?: SafeResourceUrl | string;
  svgContent?: string;
  fontSet?: string;
  fontIcon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TailwindIconRegistry {
  private _svgIcons = new Map<string, string>();
  private _svgIconSets = new Set<string>();
  private _defaultFontSetClass = 'material-icons';

  private _sanitizer = inject(DomSanitizer);

  addSvgIcon(name: string, url: SafeResourceUrl | string): this {
    // In a full implementation, this would fetch and cache the SVG
    const sanitizedUrl = typeof url === 'string' ? this._sanitizer.bypassSecurityTrustResourceUrl(url) : url;
    this._svgIcons.set(name, sanitizedUrl.toString());
    return this;
  }

  addSvgIconInNamespace(namespace: string, iconName: string, url: SafeResourceUrl | string): this {
    return this.addSvgIcon(`${namespace}:${iconName}`, url);
  }

  addSvgIconSet(url: SafeResourceUrl | string): this {
    const sanitizedUrl = typeof url === 'string' ? this._sanitizer.bypassSecurityTrustResourceUrl(url) : url;
    this._svgIconSets.add(sanitizedUrl.toString());
    return this;
  }

  addSvgIconSetInNamespace(_namespace: string, url: SafeResourceUrl | string): this {
    return this.addSvgIconSet(url);
  }

  addSvgIconLiteral(name: string, literal: SafeResourceUrl): this {
    this._svgIcons.set(name, literal.toString());
    return this;
  }

  addSvgIconLiteralInNamespace(namespace: string, iconName: string, literal: SafeResourceUrl): this {
    return this.addSvgIconLiteral(`${namespace}:${iconName}`, literal);
  }

  addSvgIconSetLiteral(literal: SafeResourceUrl): this {
    this._svgIconSets.add(literal.toString());
    return this;
  }

  addSvgIconSetLiteralInNamespace(_namespace: string, literal: SafeResourceUrl): this {
    return this.addSvgIconSetLiteral(literal);
  }

  registerFontClassAlias(alias: string, _className: string = alias): this {
    // Store font class aliases for icon rendering
    return this;
  }

  classNameForFontAlias(alias: string): string {
    return alias || this._defaultFontSetClass;
  }

  getDefaultFontSetClass(): string {
    return this._defaultFontSetClass;
  }

  setDefaultFontSetClass(className: string): this {
    this._defaultFontSetClass = className;
    return this;
  }

  getSvgIconFromUrl(_url: SafeResourceUrl): Observable<SVGElement> {
    // In a full implementation, this would fetch the SVG from the URL
    return of(this._createSvgElement('<svg></svg>'));
  }

  getNamedSvgIcon(name: string, namespace?: string): Observable<SVGElement> {
    const iconKey = namespace ? `${namespace}:${name}` : name;
    const iconData = this._svgIcons.get(iconKey);

    if (iconData) {
      return of(this._createSvgElement(iconData));
    }

    // Return empty SVG if not found
    return of(this._createSvgElement('<svg></svg>'));
  }

  private _createSvgElement(svgContent: string): SVGElement {
    const div = document.createElement('div');
    div.innerHTML = svgContent;
    const svg = div.querySelector('svg') || document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    return svg as SVGElement;
  }
}
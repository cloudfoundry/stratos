/*eslint-disable*/
/*tslint:disable*/

export class MD5 {

  private static _string: string;
  private static x: Array<number> = <Array<number>>[];
  private static k: number;
  private static AA: number;
  private static BB: number;
  private static CC: number;
  private static DD: number;
  private static a: number;
  private static b: number;
  private static c: number;
  private static d: number;
  private static S11: number = 7;
  private static S12: number = 12;
  private static S13: number = 17;
  private static S14: number = 22;
  private static S21: number = 5;
  private static S22: number = 9;
  private static S23: number = 14;
  private static S24: number = 20;
  private static S31: number = 4;
  private static S32: number = 11;
  private static S33: number = 16;
  private static S34: number = 23;
  private static S41: number = 6;
  private static S42: number = 10;
  private static S43: number = 15;
  private static S44: number = 21;

  private static RotateLeft: Function = ( lValue: number, iShiftBits: number ) : number => (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));

  private static AddUnsigned( lX: number, lY: number ) : number
  {
      let lX4: number,
          lY4: number,
          lX8: number,
          lY8: number,
          lResult: number;

      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);

      if ( (lX4 & lY4) )
      {
          return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }

      if ( (lX4 | lY4) )
      {
          if ( (lResult & 0x40000000) )
          {
              return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
          }
          else
          {
              return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
          }
      }
      else
      {
          return (lResult ^ lX8 ^ lY8);
      }
  }

  private static F: Function = ( x: number, y: number, z: number ) : number => (x & y) | ((~x) & z);

  private static G: Function = ( x: number, y: number, z: number ) : number => (x & z) | (y & (~z));

  private static H: Function = ( x: number, y: number, z: number ) : number => (x ^ y ^ z);

  private static I: Function = ( x: number, y: number, z: number ) : number => (y ^ (x | (~z)));

  private static FF( a: number, b: number, c: number, d: number, x: number, s: number, ac: number ) : number
  {
      a = MD5.AddUnsigned(a, MD5.AddUnsigned(MD5.AddUnsigned(MD5.F(b, c, d), x), ac));
      return MD5.AddUnsigned(MD5.RotateLeft(a, s), b);
  }

  private static GG( a: number, b: number, c: number, d: number, x: number, s: number, ac: number) : number
  {
      a = MD5.AddUnsigned(a, MD5.AddUnsigned(MD5.AddUnsigned(MD5.G(b, c, d), x), ac));
      return MD5.AddUnsigned(MD5.RotateLeft(a, s), b);
  }

  private static HH( a: number, b: number, c: number, d: number, x: number, s: number, ac: number ) : number
  {
      a = MD5.AddUnsigned(a, MD5.AddUnsigned(MD5.AddUnsigned(MD5.H(b, c, d), x), ac));
      return MD5.AddUnsigned(MD5.RotateLeft(a, s), b);
  }

  private static II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) : number
  {
      a = MD5.AddUnsigned(a, MD5.AddUnsigned(MD5.AddUnsigned(MD5.I(b, c, d), x), ac));
      return MD5.AddUnsigned(MD5.RotateLeft(a, s), b);
  }

  private static ConvertToWordArray( string: string ) : Array<number>
  {
      let lWordCount: number,
          lMessageLength: number = string.length,
          lNumberOfWords_temp1: number = lMessageLength + 8,
          lNumberOfWords_temp2: number = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64,
          lNumberOfWords: number = (lNumberOfWords_temp2 + 1) * 16,
          lWordArray: Array<number> = Array(lNumberOfWords - 1),
          lBytePosition: number = 0,
          lByteCount: number = 0;

      while ( lByteCount < lMessageLength )
      {
          lWordCount = (lByteCount - (lByteCount % 4)) / 4;
          lBytePosition = (lByteCount % 4) * 8;
          lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
          lByteCount++;
      }

      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;

      return lWordArray;
  }

  private static WordToHex( lValue: number ) : string
  {
      let WordToHexValue: string = "",
          WordToHexValue_temp: string = "",
          lByte: number,
          lCount: number;

      for ( lCount = 0; lCount <= 3; lCount++ )
      {
          lByte = (lValue >>> (lCount * 8)) & 255;
          WordToHexValue_temp = `0${lByte.toString(16)}`;
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
      }

      return WordToHexValue;
  }

  private static Utf8Encode( string: string ) : string
  {
      let utftext: string = "",
          c: number;

      string = string.replace(/\r\n/g, "\n");

      for ( let n = 0; n < string.length; n++ )
      {
          c = string.charCodeAt(n);

          if ( c < 128 )
          {
              utftext += String.fromCharCode(c);
          }
          else if ( (c > 127) && (c < 2048) )
          {
              utftext += String.fromCharCode((c >> 6) | 192);
              utftext += String.fromCharCode((c & 63) | 128);
          }
          else
          {
              utftext += String.fromCharCode((c >> 12) | 224);
              utftext += String.fromCharCode(((c >> 6) & 63) | 128);
              utftext += String.fromCharCode((c & 63) | 128);
          }

      }

      return utftext;
  }

  public static hash( string: string ) : string
  {
      let temp: string;

      if ( typeof string !== 'string' )
          string = JSON.stringify(string);

      MD5._string = MD5.Utf8Encode(string);
      MD5.x = MD5.ConvertToWordArray(MD5._string);

      MD5.a = 0x67452301;
      MD5.b = 0xEFCDAB89;
      MD5.c = 0x98BADCFE;
      MD5.d = 0x10325476;

      for ( MD5.k = 0; MD5.k < MD5.x.length; MD5.k += 16 )
      {
          MD5.AA = MD5.a;
          MD5.BB = MD5.b;
          MD5.CC = MD5.c;
          MD5.DD = MD5.d;
          MD5.a = MD5.FF(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k], MD5.S11, 0xD76AA478);
          MD5.d = MD5.FF(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 1], MD5.S12, 0xE8C7B756);
          MD5.c = MD5.FF(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 2], MD5.S13, 0x242070DB);
          MD5.b = MD5.FF(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 3], MD5.S14, 0xC1BDCEEE);
          MD5.a = MD5.FF(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 4], MD5.S11, 0xF57C0FAF);
          MD5.d = MD5.FF(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 5], MD5.S12, 0x4787C62A);
          MD5.c = MD5.FF(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 6], MD5.S13, 0xA8304613);
          MD5.b = MD5.FF(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 7], MD5.S14, 0xFD469501);
          MD5.a = MD5.FF(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 8], MD5.S11, 0x698098D8);
          MD5.d = MD5.FF(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 9], MD5.S12, 0x8B44F7AF);
          MD5.c = MD5.FF(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 10], MD5.S13, 0xFFFF5BB1);
          MD5.b = MD5.FF(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 11], MD5.S14, 0x895CD7BE);
          MD5.a = MD5.FF(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 12], MD5.S11, 0x6B901122);
          MD5.d = MD5.FF(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 13], MD5.S12, 0xFD987193);
          MD5.c = MD5.FF(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 14], MD5.S13, 0xA679438E);
          MD5.b = MD5.FF(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 15], MD5.S14, 0x49B40821);
          MD5.a = MD5.GG(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 1], MD5.S21, 0xF61E2562);
          MD5.d = MD5.GG(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 6], MD5.S22, 0xC040B340);
          MD5.c = MD5.GG(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 11], MD5.S23, 0x265E5A51);
          MD5.b = MD5.GG(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k], MD5.S24, 0xE9B6C7AA);
          MD5.a = MD5.GG(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 5], MD5.S21, 0xD62F105D);
          MD5.d = MD5.GG(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 10], MD5.S22, 0x2441453);
          MD5.c = MD5.GG(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 15], MD5.S23, 0xD8A1E681);
          MD5.b = MD5.GG(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 4], MD5.S24, 0xE7D3FBC8);
          MD5.a = MD5.GG(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 9], MD5.S21, 0x21E1CDE6);
          MD5.d = MD5.GG(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 14], MD5.S22, 0xC33707D6);
          MD5.c = MD5.GG(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 3], MD5.S23, 0xF4D50D87);
          MD5.b = MD5.GG(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 8], MD5.S24, 0x455A14ED);
          MD5.a = MD5.GG(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 13], MD5.S21, 0xA9E3E905);
          MD5.d = MD5.GG(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 2], MD5.S22, 0xFCEFA3F8);
          MD5.c = MD5.GG(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 7], MD5.S23, 0x676F02D9);
          MD5.b = MD5.GG(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 12], MD5.S24, 0x8D2A4C8A);
          MD5.a = MD5.HH(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 5], MD5.S31, 0xFFFA3942);
          MD5.d = MD5.HH(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 8], MD5.S32, 0x8771F681);
          MD5.c = MD5.HH(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 11], MD5.S33, 0x6D9D6122);
          MD5.b = MD5.HH(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 14], MD5.S34, 0xFDE5380C);
          MD5.a = MD5.HH(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 1], MD5.S31, 0xA4BEEA44);
          MD5.d = MD5.HH(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 4], MD5.S32, 0x4BDECFA9);
          MD5.c = MD5.HH(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 7], MD5.S33, 0xF6BB4B60);
          MD5.b = MD5.HH(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 10], MD5.S34, 0xBEBFBC70);
          MD5.a = MD5.HH(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 13], MD5.S31, 0x289B7EC6);
          MD5.d = MD5.HH(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k], MD5.S32, 0xEAA127FA);
          MD5.c = MD5.HH(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 3], MD5.S33, 0xD4EF3085);
          MD5.b = MD5.HH(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 6], MD5.S34, 0x4881D05);
          MD5.a = MD5.HH(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 9], MD5.S31, 0xD9D4D039);
          MD5.d = MD5.HH(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 12], MD5.S32, 0xE6DB99E5);
          MD5.c = MD5.HH(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 15], MD5.S33, 0x1FA27CF8);
          MD5.b = MD5.HH(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 2], MD5.S34, 0xC4AC5665);
          MD5.a = MD5.II(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k], MD5.S41, 0xF4292244);
          MD5.d = MD5.II(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 7], MD5.S42, 0x432AFF97);
          MD5.c = MD5.II(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 14], MD5.S43, 0xAB9423A7);
          MD5.b = MD5.II(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 5], MD5.S44, 0xFC93A039);
          MD5.a = MD5.II(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 12], MD5.S41, 0x655B59C3);
          MD5.d = MD5.II(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 3], MD5.S42, 0x8F0CCC92);
          MD5.c = MD5.II(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 10], MD5.S43, 0xFFEFF47D);
          MD5.b = MD5.II(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 1], MD5.S44, 0x85845DD1);
          MD5.a = MD5.II(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 8], MD5.S41, 0x6FA87E4F);
          MD5.d = MD5.II(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 15], MD5.S42, 0xFE2CE6E0);
          MD5.c = MD5.II(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 6], MD5.S43, 0xA3014314);
          MD5.b = MD5.II(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 13], MD5.S44, 0x4E0811A1);
          MD5.a = MD5.II(MD5.a, MD5.b, MD5.c, MD5.d, MD5.x[MD5.k + 4], MD5.S41, 0xF7537E82);
          MD5.d = MD5.II(MD5.d, MD5.a, MD5.b, MD5.c, MD5.x[MD5.k + 11], MD5.S42, 0xBD3AF235);
          MD5.c = MD5.II(MD5.c, MD5.d, MD5.a, MD5.b, MD5.x[MD5.k + 2], MD5.S43, 0x2AD7D2BB);
          MD5.b = MD5.II(MD5.b, MD5.c, MD5.d, MD5.a, MD5.x[MD5.k + 9], MD5.S44, 0xEB86D391);

          MD5.a = MD5.AddUnsigned(MD5.a, MD5.AA);
          MD5.b = MD5.AddUnsigned(MD5.b, MD5.BB);
          MD5.c = MD5.AddUnsigned(MD5.c, MD5.CC);
          MD5.d = MD5.AddUnsigned(MD5.d, MD5.DD);
      }

      temp = MD5.WordToHex(MD5.a) + MD5.WordToHex(MD5.b) + MD5.WordToHex(MD5.c) + MD5.WordToHex(MD5.d);
      return temp.toLowerCase();
  }
}

import axios from "axios";

export const baseURL = "https://gateway.dataverse.art";

export class IPFS {
  async uploadFile({
    file,
    jws,
    siweMessage
  }: {
    file: File;
    jws: object;
    siweMessage: object;
  }): Promise<string> {
    const requestPath = "/v0/upload";
    const res = await axios.put(`${baseURL}${requestPath}`, file, {
      headers: {
        Authorization: `Bearer ${jws}`,
        "x-dataverse-siwe": btoa(JSON.stringify(siweMessage))
      }
    });
    return res.data.cid.replace("ipfs://", "");
  }

  getFileLink(cid: string): string {
    return `${baseURL}/ipfs/${cid}`;
  }

  async getFileContentType(cid: string): Promise<string> {
    const res = await axios.head(this.getFileLink(cid));
    return res?.headers?.["Content-Type"] as string;
  }

  async retriveFile(cid: string): Promise<string> {
    const res = await axios.get(this.getFileLink(cid));
    return res.data;
  }

  async getUserStorageSpaceSize({
    jws,
    siweMessage
  }: {
    jws: any;
    siweMessage: object;
  }): Promise<number> {
    const requestPath = "/v0/block_sum";

    const res = await axios.get(`${baseURL}${requestPath}`, {
      headers: {
        Authorization: `Bearer ${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`,
        "x-dataverse-siwe": btoa(JSON.stringify(siweMessage))
      }
    });

    return parseInt(res.data.block_size) * 256;
  }
}

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import { TokenInfo, LPInfo, RouteInfo, PathIdArray } from "../types/interfaces";
import { DB_NAME } from "../config/constants";

export class DatabaseManager {
  private tokenMap = new Map<string, TokenInfo>();
  private lpMap = new Map<string, LPInfo>();
  private routeMap = new Map<string, RouteInfo>();
  private lp2routeMapping = new Map<string, PathIdArray>();

  async initialize() {
    const db = await this.openDatabase();
    await this.fetchData(db);
    await db.close();
  }

  private async openDatabase(): Promise<Database> {
    return open({
      filename: DB_NAME,
      driver: sqlite3.Database,
    });
  }

  private async fetchData(db: Database) {
    // Fetch TokenInfo
    const tokens = (await db.all("SELECT * FROM TokenInfo")) as TokenInfo[];
    tokens.forEach((token: TokenInfo) => {
      this.tokenMap.set(token.address.toLocaleLowerCase(), token);
    });

    // Fetch LPInfo
    const lps = (await db.all("SELECT * FROM LPInfo")) as LPInfo[];
    lps.forEach((lp: LPInfo) => {
      this.lpMap.set(lp.address.toLocaleLowerCase(), {
        ...lp,
        reserve1: 0n,
        reserve2: 0n,
      });
    });

    // Fetch RouteInfo
    const routes = (await db.all("SELECT id, path FROM Route")) as {
      id: string;
      path: string;
    }[];
    routes.forEach((route: { id: string; path: string }) => {
      const pathArray: [string, [string]][] = JSON.parse(route.path);
      const routeInfo = pathArray.map(([target, [lp]]: [string, [string]]) => ({
        target,
        lp,
      }));
      this.routeMap.set(route.id, { id: route.id, routeInfo });

      // Update lp2routeMapping for each LP pool in the route
      routeInfo.forEach(({ lp }) => {
        if (!this.lp2routeMapping.has(lp)) {
          this.lp2routeMapping.set(lp, []);
        }
        this.lp2routeMapping.get(lp)!.push(route.id);
      });
    });
  }

  getTokenMap(): Map<string, TokenInfo> {
    return this.tokenMap;
  }

  getLPMap(): Map<string, LPInfo> {
    return this.lpMap;
  }

  getRouteMap(): Map<string, RouteInfo> {
    return this.routeMap;
  }

  getLP2RouteMapping(): Map<string, PathIdArray> {
    return this.lp2routeMapping;
  }
}

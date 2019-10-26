import { Injectable } from '@angular/core';

// App Configurations
import { ROWS, COLS } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class GameBoardService {
  getEmptyBoard(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
}

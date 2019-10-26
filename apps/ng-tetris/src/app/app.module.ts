import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// App Components
import { AppComponent } from './app.component';
import { GameBoardComponent } from './game-board/game-board.component';

@NgModule({
  declarations: [AppComponent, GameBoardComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

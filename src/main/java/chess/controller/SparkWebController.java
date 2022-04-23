package chess.controller;

import static spark.Spark.get;
import static spark.Spark.post;

import chess.exception.dto.ErrorMessageDto;
import chess.dto.MovePositionDto;
import chess.service.ChessGameService;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import java.util.HashMap;
import java.util.Map;
import spark.ModelAndView;
import spark.template.handlebars.HandlebarsTemplateEngine;

public class SparkWebController {

    private final ChessGameService chessGameService;
    private final Gson gson;

    public SparkWebController(ChessGameService chessGameService) {
        this.chessGameService = chessGameService;
        this.gson = new Gson();
    }

    public void run() {
        get("/", (request, response) -> render(new HashMap<>(), "game.hbs"));

        post("/new-game", (request, response) -> {
            try {
                final JsonElement jsonElement = JsonParser.parseString(request.body());
                final String gameName = jsonElement.getAsJsonObject().get("gameName").getAsString();
                return gson.toJson(chessGameService.createNewChessGame(gameName));
            } catch (Exception e) {
                response.status(400);
                return gson.toJson(new ErrorMessageDto(e.getMessage()));
            }
        });

        get("/status/:chessGameName", (request, response) -> {
            final String chessGameName = request.params(":chessGameName");
            return gson.toJson(chessGameService.findStatus(chessGameName));
        });

        get("/finish/:chessGameName", (request, response) -> {
            final String chessGameName = request.params(":chessGameName");
            return gson.toJson(chessGameService.finishGame(chessGameName));
        });

        post("/move", (request, response) -> {
            final MovePositionDto movePositionDto = gson.fromJson(request.body(), MovePositionDto.class);
            final String chessGameName = movePositionDto.getChessGameName();
            final String current = movePositionDto.getCurrent();
            final String destination = movePositionDto.getDestination();
            return gson.toJson(chessGameService.move(chessGameName, current, destination));
        });

        get("/load", (request, response) -> {
            try {
                final JsonElement jsonElement = JsonParser.parseString(request.body());
                final String gameName = jsonElement.getAsJsonObject().get("gameName").getAsString();
                return gson.toJson(chessGameService.loadChessGame(gameName));
            } catch (Exception e) {
                response.status(400);
                return gson.toJson(new ErrorMessageDto(e.getMessage()));
            }
        });
    }

    private static String render(Map<String, Object> model, String templatePath) {
        return new HandlebarsTemplateEngine().render(new ModelAndView(model, templatePath));
    }
}
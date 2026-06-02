package com.devteria.cinemaback_end.article.mapper;

import com.devteria.cinemaback_end.article.dto.ArticleRequest;
import com.devteria.cinemaback_end.article.dto.ArticleResponse;
import com.devteria.cinemaback_end.article.entity.Article;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ArticleMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "publishDate", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "movie", ignore = true) // BỔ SUNG: Bỏ qua không map movie tự động
    Article toArticle(ArticleRequest request);

    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.fullName", target = "managerName")
    // BỔ SUNG: Lấy thông tin phim (MapStruct tự động xử lý an toàn nếu movie bị null)
    @Mapping(source = "movie.id", target = "movieId")
    @Mapping(source = "movie.title", target = "movieTitle")
    @Mapping(source = "featured", target = "featured")
    ArticleResponse toArticleResponse(Article article);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "publishDate", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "movie", ignore = true) // BỔ SUNG: Bỏ qua không map movie tự động
    void updateArticle(@MappingTarget Article article, ArticleRequest request);


}
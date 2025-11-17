package com.heritage.app.presentation.home;

import com.heritage.app.domain.usecase.GetPerformersUseCase;
import com.heritage.app.domain.usecase.GetRecentContentUseCase;
import com.heritage.app.domain.usecase.GetRecommendedContentUseCase;
import com.heritage.app.domain.usecase.GetTrendingContentUseCase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class HomeViewModel_Factory implements Factory<HomeViewModel> {
  private final Provider<GetTrendingContentUseCase> getTrendingContentUseCaseProvider;

  private final Provider<GetRecommendedContentUseCase> getRecommendedContentUseCaseProvider;

  private final Provider<GetRecentContentUseCase> getRecentContentUseCaseProvider;

  private final Provider<GetPerformersUseCase> getPerformersUseCaseProvider;

  private HomeViewModel_Factory(
      Provider<GetTrendingContentUseCase> getTrendingContentUseCaseProvider,
      Provider<GetRecommendedContentUseCase> getRecommendedContentUseCaseProvider,
      Provider<GetRecentContentUseCase> getRecentContentUseCaseProvider,
      Provider<GetPerformersUseCase> getPerformersUseCaseProvider) {
    this.getTrendingContentUseCaseProvider = getTrendingContentUseCaseProvider;
    this.getRecommendedContentUseCaseProvider = getRecommendedContentUseCaseProvider;
    this.getRecentContentUseCaseProvider = getRecentContentUseCaseProvider;
    this.getPerformersUseCaseProvider = getPerformersUseCaseProvider;
  }

  @Override
  public HomeViewModel get() {
    return newInstance(getTrendingContentUseCaseProvider.get(), getRecommendedContentUseCaseProvider.get(), getRecentContentUseCaseProvider.get(), getPerformersUseCaseProvider.get());
  }

  public static HomeViewModel_Factory create(
      Provider<GetTrendingContentUseCase> getTrendingContentUseCaseProvider,
      Provider<GetRecommendedContentUseCase> getRecommendedContentUseCaseProvider,
      Provider<GetRecentContentUseCase> getRecentContentUseCaseProvider,
      Provider<GetPerformersUseCase> getPerformersUseCaseProvider) {
    return new HomeViewModel_Factory(getTrendingContentUseCaseProvider, getRecommendedContentUseCaseProvider, getRecentContentUseCaseProvider, getPerformersUseCaseProvider);
  }

  public static HomeViewModel newInstance(GetTrendingContentUseCase getTrendingContentUseCase,
      GetRecommendedContentUseCase getRecommendedContentUseCase,
      GetRecentContentUseCase getRecentContentUseCase, GetPerformersUseCase getPerformersUseCase) {
    return new HomeViewModel(getTrendingContentUseCase, getRecommendedContentUseCase, getRecentContentUseCase, getPerformersUseCase);
  }
}

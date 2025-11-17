package com.heritage.app.domain.usecase;

import com.heritage.app.domain.repository.ContentRepository;
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
public final class GetRecommendedContentUseCase_Factory implements Factory<GetRecommendedContentUseCase> {
  private final Provider<ContentRepository> repositoryProvider;

  private GetRecommendedContentUseCase_Factory(Provider<ContentRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public GetRecommendedContentUseCase get() {
    return newInstance(repositoryProvider.get());
  }

  public static GetRecommendedContentUseCase_Factory create(
      Provider<ContentRepository> repositoryProvider) {
    return new GetRecommendedContentUseCase_Factory(repositoryProvider);
  }

  public static GetRecommendedContentUseCase newInstance(ContentRepository repository) {
    return new GetRecommendedContentUseCase(repository);
  }
}

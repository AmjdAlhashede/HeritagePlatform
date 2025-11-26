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
public final class GetTrendingContentUseCase_Factory implements Factory<GetTrendingContentUseCase> {
  private final Provider<ContentRepository> repositoryProvider;

  private GetTrendingContentUseCase_Factory(Provider<ContentRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public GetTrendingContentUseCase get() {
    return newInstance(repositoryProvider.get());
  }

  public static GetTrendingContentUseCase_Factory create(
      Provider<ContentRepository> repositoryProvider) {
    return new GetTrendingContentUseCase_Factory(repositoryProvider);
  }

  public static GetTrendingContentUseCase newInstance(ContentRepository repository) {
    return new GetTrendingContentUseCase(repository);
  }
}

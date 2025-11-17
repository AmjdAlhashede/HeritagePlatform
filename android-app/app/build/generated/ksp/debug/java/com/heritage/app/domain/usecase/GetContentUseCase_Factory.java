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
public final class GetContentUseCase_Factory implements Factory<GetContentUseCase> {
  private final Provider<ContentRepository> repositoryProvider;

  private GetContentUseCase_Factory(Provider<ContentRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public GetContentUseCase get() {
    return newInstance(repositoryProvider.get());
  }

  public static GetContentUseCase_Factory create(Provider<ContentRepository> repositoryProvider) {
    return new GetContentUseCase_Factory(repositoryProvider);
  }

  public static GetContentUseCase newInstance(ContentRepository repository) {
    return new GetContentUseCase(repository);
  }
}

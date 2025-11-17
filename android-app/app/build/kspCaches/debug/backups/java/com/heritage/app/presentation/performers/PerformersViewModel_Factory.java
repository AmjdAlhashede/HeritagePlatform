package com.heritage.app.presentation.performers;

import com.heritage.app.domain.usecase.GetPerformersUseCase;
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
public final class PerformersViewModel_Factory implements Factory<PerformersViewModel> {
  private final Provider<GetPerformersUseCase> getPerformersUseCaseProvider;

  private PerformersViewModel_Factory(Provider<GetPerformersUseCase> getPerformersUseCaseProvider) {
    this.getPerformersUseCaseProvider = getPerformersUseCaseProvider;
  }

  @Override
  public PerformersViewModel get() {
    return newInstance(getPerformersUseCaseProvider.get());
  }

  public static PerformersViewModel_Factory create(
      Provider<GetPerformersUseCase> getPerformersUseCaseProvider) {
    return new PerformersViewModel_Factory(getPerformersUseCaseProvider);
  }

  public static PerformersViewModel newInstance(GetPerformersUseCase getPerformersUseCase) {
    return new PerformersViewModel(getPerformersUseCase);
  }
}

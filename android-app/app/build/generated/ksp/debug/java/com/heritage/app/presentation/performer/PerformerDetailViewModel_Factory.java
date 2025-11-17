package com.heritage.app.presentation.performer;

import com.heritage.app.domain.usecase.GetPerformerByIdUseCase;
import com.heritage.app.domain.usecase.GetPerformerContentUseCase;
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
public final class PerformerDetailViewModel_Factory implements Factory<PerformerDetailViewModel> {
  private final Provider<GetPerformerByIdUseCase> getPerformerByIdUseCaseProvider;

  private final Provider<GetPerformerContentUseCase> getPerformerContentUseCaseProvider;

  private PerformerDetailViewModel_Factory(
      Provider<GetPerformerByIdUseCase> getPerformerByIdUseCaseProvider,
      Provider<GetPerformerContentUseCase> getPerformerContentUseCaseProvider) {
    this.getPerformerByIdUseCaseProvider = getPerformerByIdUseCaseProvider;
    this.getPerformerContentUseCaseProvider = getPerformerContentUseCaseProvider;
  }

  @Override
  public PerformerDetailViewModel get() {
    return newInstance(getPerformerByIdUseCaseProvider.get(), getPerformerContentUseCaseProvider.get());
  }

  public static PerformerDetailViewModel_Factory create(
      Provider<GetPerformerByIdUseCase> getPerformerByIdUseCaseProvider,
      Provider<GetPerformerContentUseCase> getPerformerContentUseCaseProvider) {
    return new PerformerDetailViewModel_Factory(getPerformerByIdUseCaseProvider, getPerformerContentUseCaseProvider);
  }

  public static PerformerDetailViewModel newInstance(
      GetPerformerByIdUseCase getPerformerByIdUseCase,
      GetPerformerContentUseCase getPerformerContentUseCase) {
    return new PerformerDetailViewModel(getPerformerByIdUseCase, getPerformerContentUseCase);
  }
}

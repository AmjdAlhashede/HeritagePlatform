package com.heritage.app.di;

import com.heritage.app.data.remote.api.HeritageApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import retrofit2.Retrofit;

@ScopeMetadata("javax.inject.Singleton")
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
public final class AppModule_ProvideHeritageApiFactory implements Factory<HeritageApi> {
  private final Provider<Retrofit> retrofitProvider;

  private AppModule_ProvideHeritageApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public HeritageApi get() {
    return provideHeritageApi(retrofitProvider.get());
  }

  public static AppModule_ProvideHeritageApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new AppModule_ProvideHeritageApiFactory(retrofitProvider);
  }

  public static HeritageApi provideHeritageApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideHeritageApi(retrofit));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function sha1(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function POST(request: NextRequest) {
  try {
    const { siteId, files, token, projectId } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Not connected to Netlify' }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Log the parameters received by the API
    console.log('Deployment parameters:', { 
      hasFiles: !!files && Object.keys(files).length > 0,
      fileCount: files ? Object.keys(files).length : 0,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      projectId,
      siteId: siteId || 'not provided'
    });

    let targetSiteId = siteId;
    let siteInfo: any;

    // If no siteId provided, create a new site
    if (!targetSiteId) {
      // Create a shorter site name to stay within Netlify's limits
      // Use just the first 8 characters of the project ID and a shorter timestamp
      const shortProjectId = projectId.slice(0, 8);
      const timestamp = Math.floor(Date.now() / 1000) % 10000; // Last 4 digits of unix timestamp
      const siteName = `cloneai-${shortProjectId}-${timestamp}`;
      
      console.log(`Creating new Netlify site: ${siteName}`);
      
      try {
        const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: siteName,
            custom_domain: null,
          }),
        });

        // Log the response details
        const responseText = await createSiteResponse.text();
        console.log(`Netlify site creation response status: ${createSiteResponse.status}`);
        console.log(`Netlify site creation response: ${responseText}`);
        
        if (!createSiteResponse.ok) {
          return NextResponse.json({ 
            error: 'Failed to create site', 
            details: responseText,
            status: createSiteResponse.status
          }, { status: 400 });
        }

        const newSite = JSON.parse(responseText);
        targetSiteId = newSite.id;
        siteInfo = {
          id: newSite.id,
          name: newSite.name,
          url: newSite.url,
          projectId,
        };
        
        console.log(`Successfully created Netlify site: ${siteInfo.name} (${siteInfo.id})`);
      } catch (error) {
        console.error('Error creating Netlify site:', error);
        return NextResponse.json({ 
          error: 'Exception occurred creating site', 
          details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
      }
    } else {
      // Get existing site info
      console.log(`Fetching existing Netlify site: ${targetSiteId}`);
      
      try {
        const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseText = await siteResponse.text();
        console.log(`Netlify site fetch response status: ${siteResponse.status}`);
        console.log(`Netlify site fetch response: ${responseText}`);

        if (siteResponse.ok) {
          const existingSite = JSON.parse(responseText);
          siteInfo = {
            id: existingSite.id,
            name: existingSite.name,
            url: existingSite.url,
            projectId,
          };
          console.log(`Successfully fetched existing site: ${siteInfo.name} (${siteInfo.id})`);
        } else {
          // If site doesn't exist, create a new one
          console.log(`Site ${targetSiteId} not found, creating a new one`);
          // Create a shorter site name consistent with the first method
          const shortProjectId = projectId.slice(0, 8);
          const timestamp = Math.floor(Date.now() / 1000) % 10000; // Last 4 digits of unix timestamp
          const siteName = `cloneai-${shortProjectId}-${timestamp}`;
          
          try {
            const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: siteName,
                custom_domain: null,
              }),
            });

            const createResponseText = await createSiteResponse.text();
            console.log(`Netlify site creation response status: ${createSiteResponse.status}`);
            console.log(`Netlify site creation response: ${createResponseText}`);

            if (!createSiteResponse.ok) {
              return NextResponse.json({ 
                error: 'Failed to create site after existing site not found', 
                details: createResponseText,
                status: createSiteResponse.status
              }, { status: 400 });
            }

            const newSite = JSON.parse(createResponseText);
            targetSiteId = newSite.id;
            siteInfo = {
              id: newSite.id,
              name: newSite.name,
              url: newSite.url,
              projectId,
            };
            console.log(`Successfully created new site: ${siteInfo.name} (${siteInfo.id})`);
          } catch (error) {
            console.error('Error creating new site after existing site not found:', error);
            return NextResponse.json({ 
              error: 'Exception creating site after existing site not found', 
              details: error instanceof Error ? error.message : String(error) 
            }, { status: 500 });
          }
        }
      } catch (error) {
        console.error('Error fetching existing site:', error);
        return NextResponse.json({ 
          error: 'Exception fetching existing site', 
          details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
      }
    }

    // Create file digests
    const fileDigests: Record<string, string> = {};

    for (const [filePath, content] of Object.entries(files)) {
      // Ensure file path starts with a forward slash
      const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;
      const hash = await sha1(content as string);
      fileDigests[normalizedPath] = hash;
    }

    console.log(`Prepared file digests for ${Object.keys(fileDigests).length} files`);

    // Create a new deploy with digests
    console.log(`Creating deployment for site: ${targetSiteId}`);
    
    try {
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: fileDigests,
          async: true,
          skip_processing: false,
          draft: false,
          function_schedules: [],
          required: Object.keys(fileDigests),
          framework: null,
        }),
      });

      const deployResponseText = await deployResponse.text();
      console.log(`Deploy creation response status: ${deployResponse.status}`);
      console.log(`Deploy creation response: ${deployResponseText}`);

      if (!deployResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to create deployment', 
          details: deployResponseText,
          status: deployResponse.status 
        }, { status: 400 });
      }

      const deploy = JSON.parse(deployResponseText);
      console.log(`Successfully created deployment: ${deploy.id}`);

      let retryCount = 0;
      const maxRetries = 60;

      // Poll until deploy is ready for file uploads
      while (retryCount < maxRetries) {
        const statusResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys/${deploy.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const status = await statusResponse.json();

        if (status.state === 'prepared' || status.state === 'uploaded') {
          // Upload all files
          for (const [filePath, content] of Object.entries(files)) {
            const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;

            let uploadSuccess = false;
            let uploadRetries = 0;

            while (!uploadSuccess && uploadRetries < 3) {
              try {
                const uploadResponse = await fetch(
                  `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${normalizedPath}`,
                  {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/octet-stream',
                    },
                    body: content as string,
                  },
                );

                uploadSuccess = uploadResponse.ok;

                if (!uploadSuccess) {
                  console.error('Upload failed:', await uploadResponse.text());
                  uploadRetries++;
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                }
              } catch (error) {
                console.error('Upload error:', error);
                uploadRetries++;
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
            }

            if (!uploadSuccess) {
              return NextResponse.json({ error: `Failed to upload file ${filePath}` }, { status: 500 });
            }
          }
        }

        if (status.state === 'ready') {
          // Save the Netlify deployment information to the database
          try {
            const now = new Date();
            
            // Update the project with the Netlify deployment info
            await db.update(projects)
              .set({
                netlifySiteId: siteInfo.id,
                netlifySiteUrl: status.ssl_url || status.url,
                netlifySiteName: siteInfo.name,
                netlifySiteDeployId: status.id,
                netlifySiteDeployedAt: now,
                updatedAt: now
              })
              .where(eq(projects.id, projectId));
            
            // Return success response
            return NextResponse.json({
              success: true,
              deploy: {
                id: status.id,
                state: status.state,
                url: status.ssl_url || status.url,
              },
              site: siteInfo,
            });
          } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return success since the deployment worked
            return NextResponse.json({
              success: true,
              deploy: {
                id: status.id,
                state: status.state,
                url: status.ssl_url || status.url,
              },
              site: siteInfo,
              dbError: 'Failed to update database but deployment was successful',
            });
          }
        }

        if (status.state === 'error') {
          return NextResponse.json({ error: status.error_message || 'Deploy preparation failed' }, { status: 500 });
        }

        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (retryCount >= maxRetries) {
        return NextResponse.json({ error: 'Deploy preparation timed out' }, { status: 500 });
      }

      // Default return if we somehow exit the loop
      return NextResponse.json({
        success: true,
        deploy: {
          id: deploy.id,
          state: deploy.state,
        },
        site: siteInfo,
      });
    } catch (error) {
      console.error('Deploy error:', error);
      return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
  }
} 